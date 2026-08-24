const pool = require('./pgPool');

const API_BASE = 'https://api.themoviedb.org/3';
const SYNC_AFTER_DAYS = 30;
const genreCache = new Map();
const SEARCH_ALIASES = {
  Frozen: ['Frozen: Uma Aventura Congelante'],
  'Frozen 2': ['Frozen II', 'Frozen 2'],
  'Para todos os garotos que já amei 2': [
    'Para todos os garotos: P.S. Ainda amo você',
    'To All the Boys: P.S. I Still Love You',
  ],
  'Masterchef Brasil: Season 3': ['MasterChef Brasil'],
  'Masterchef Profissionais: Season 2': ['MasterChef Profissionais', 'MasterChef: The Professionals'],
  'Dexter: Season 1': ['Dexter'],
};
const GENRE_LABELS = {
  'Action & Adventure': 'Ação e aventura',
  'Sci-Fi & Fantasy': 'Ficção científica e fantasia',
};

function apiKey() {
  return process.env.TMDB_API_KEY;
}

function cleanTitle(title) {
  return String(title ?? '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .toLowerCase()
    .trim();
}

function similarity(a, b) {
  const left = cleanTitle(a);
  const right = cleanTitle(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.85;

  const leftWords = new Set(left.split(/\s+/));
  const rightWords = new Set(right.split(/\s+/));
  const intersection = [...leftWords].filter(word => rightWords.has(word)).length;
  return intersection / Math.max(leftWords.size, rightWords.size);
}

async function tmdbFetch(path, params = {}) {
  const key = apiKey();
  if (!key) throw new Error('TMDB_API_KEY não configurada');

  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set('api_key', key);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(name, value);
    }
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB respondeu ${response.status} em ${path}`);
  }
  return response.json();
}

async function getGenres(language) {
  if (genreCache.has(language)) return genreCache.get(language);
  const [movies, tv] = await Promise.all([
    tmdbFetch('/genre/movie/list', { language }),
    tmdbFetch('/genre/tv/list', { language }),
  ]);
  const genres = new Map();
  // Prefer the movie translation when an ID is shared by movie and TV
  // catalogs. Some TMDB responses otherwise replace Portuguese labels with
  // the TV catalog's English name.
  for (const genre of [...(movies.genres ?? []), ...(tv.genres ?? [])]) {
    if (!genres.has(genre.id)) genres.set(genre.id, GENRE_LABELS[genre.name] ?? genre.name);
  }
  genreCache.set(language, genres);
  return genres;
}

async function searchCandidates(query, language) {
  const result = await tmdbFetch('/search/multi', {
    query,
    language,
    include_adult: 'false',
    page: 1,
  });
  return (result.results ?? [])
    .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
    .map(item => {
      const localized = item.title ?? item.name ?? '';
      const original = item.original_title ?? item.original_name ?? '';
      let score = similarity(query, localized);
      if (cleanTitle(localized) === cleanTitle(query)) score = 1;
      else if (cleanTitle(original) === cleanTitle(query)) score = Math.max(score, 0.84);
      // For ambiguous names such as "Os Vingadores", prefer a movie match
      // over an old TV series when the watchlist is a film list.
      if (item.media_type === 'movie') score += 0.15;
      score += Math.min(Number(item.popularity ?? 0) / 1000, 0.05);
      return { item, score };
    });
}

async function findTitle(title, language = 'pt-BR') {
  const queries = [title, ...(SEARCH_ALIASES[title] ?? [])];
  const candidates = [];
  for (const query of queries) candidates.push(...await searchCandidates(query, language));
  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];
  // For sequels and localized titles, TMDB can return a valid result with a
  // lower textual score. Avoid assigning an unrelated title.
  if (!best || best.score < 0.25) return null;
  return best.item;
}

async function lookupMovie(title) {
  const language = 'pt-BR';
  const [item, genres] = await Promise.all([
    findTitle(title, language),
    getGenres(language),
  ]);
  if (!item) {
    return { tmdbId: null, mediaType: null, genres: [], category: 'Outros' };
  }

  const names = (item.genre_ids ?? [])
    .map(id => genres.get(id))
    .filter(Boolean);
  return {
    tmdbId: item.id ?? null,
    mediaType: item.media_type ?? null,
    genres: [...new Set(names)],
    category: GENRE_LABELS[names[0]] ?? names[0] ?? 'Outros',
  };
}

async function getDetails(movie) {
  if (!movie?.tmdb_id) return null;
  const type = movie.tmdb_media_type === 'tv' ? 'tv' : 'movie';
  return tmdbFetch(`/${type}/${movie.tmdb_id}`, {
    language: 'pt-BR',
    append_to_response: 'credits,watch/providers',
  });
}

async function getSimilar(movie) {
  if (!movie?.tmdb_id) return [];
  const type = movie.tmdb_media_type === 'tv' ? 'tv' : 'movie';
  const result = await tmdbFetch(`/${type}/${movie.tmdb_id}/similar`, {
    language: 'pt-BR',
    page: 1,
  });
  return (result.results ?? []).slice(0, 10);
}

async function getRecommendations(movies, { limit = 8, anchorName = null } = {}) {
  const watched = movies
    .filter(movie => movie.watched && movie.tmdb_id && movie.note !== null)
    .sort((a, b) => Number(b.note ?? 0) - Number(a.note ?? 0))
    .slice(0, 5);
  const requestedAnchor = anchorName
    ? movies.find(movie => cleanTitle(movie.name) === cleanTitle(anchorName) && movie.tmdb_id)
    : null;
  if (!watched.length && !requestedAnchor) return [];

  // Um único filme-foco por execução mantém a relação temática entre as
  // indicações. Sem argumento, escolhemos dinamicamente entre os favoritos.
  const focus = requestedAnchor ?? watched[Math.floor(Math.random() * Math.min(watched.length, 3))];

  const existing = new Set(movies.map(movie => cleanTitle(movie.name)));
  const existingIds = new Set(movies.map(movie => movie.tmdb_id).filter(Boolean));
  const genres = await getGenres('pt-BR');
  const genreFrequency = new Map();
  for (const movie of watched) {
    for (const genre of movie.genres ?? []) {
      genreFrequency.set(genre, (genreFrequency.get(genre) ?? 0) + Number(movie.note ?? 0));
    }
  }

  const candidates = new Map();
  const focusGenres = new Set(focus.genres ?? []);
  const type = focus.tmdb_media_type === 'tv' ? 'tv' : 'movie';
  const [similar, recommended] = await Promise.all([
    getSimilar(focus),
    tmdbFetch(`/${type}/${focus.tmdb_id}/recommendations`, { language: 'pt-BR', page: 1 })
      .then(result => result.results ?? []),
  ]);
  for (const [item, relation] of [
    ...recommended.map(item => [item, 'recommendation']),
    ...similar.map(item => [item, 'similar']),
  ]) {
      const title = item.title ?? item.name;
      if (
        !title ||
        existingIds.has(item.id) ||
        existing.has(cleanTitle(title)) ||
        Number(item.vote_count ?? 0) < 20
      ) continue;

      const itemGenres = (item.genre_ids ?? [])
        .map(id => genres.get(id))
        .filter(Boolean);
      const matchedFavoriteGenres = itemGenres.filter(genre => genreFrequency.has(genre));
      const matchedFocusGenres = itemGenres.filter(genre => (focus.genres ?? []).includes(genre));
      const current = candidates.get(item.id);
      const sourceScore = Number(focus.note ?? 7) / 10;
      const popularityScore = Math.min(Math.log10(Number(item.popularity ?? 0) + 1), 2) * 0.35;
      const relationScore = relation === 'recommendation' ? 6 : 4;
      const genreScore = matchedFocusGenres.length * 4
        + matchedFavoriteGenres.length * (anchorName ? 0.4 : 1);
      const unrelatedPenalty = focusGenres.size > 0 && matchedFocusGenres.length === 0 ? 3 : 0;
      const score = Number(item.vote_average ?? 0) * 1.5
        + popularityScore
        + relationScore
        + genreScore
        - unrelatedPenalty
        + sourceScore;

      if (!current || score > current.score) {
        candidates.set(item.id, {
          ...item,
          media_type: type,
          score,
          source: focus.name,
          sourceNote: Number(focus.note ?? 0),
          matchedFavoriteGenres: [...new Set([...matchedFocusGenres, ...matchedFavoriteGenres])],
        });
      }
  }

  const pool = [...candidates.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
  const selected = [];
  const usedGenres = new Set();

  // Sorteio ponderado: títulos bem avaliados continuam tendo vantagem, mas
  // cada execução pode trazer uma combinação diferente e mais variada.
  while (selected.length < Math.min(limit, pool.length)) {
    const available = pool.filter(item => !selected.some(choice => choice.id === item.id));
    if (!available.length) break;

    const weighted = available.map(item => {
      const genrePenalty = item.matchedFavoriteGenres?.some(genre => usedGenres.has(genre)) ? 0.65 : 1;
      return { item, weight: Math.max(0.1, item.score * genrePenalty) };
    });
    const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = Math.random() * totalWeight;
    let chosen = weighted[weighted.length - 1].item;
    for (const entry of weighted) {
      cursor -= entry.weight;
      if (cursor <= 0) {
        chosen = entry.item;
        break;
      }
    }
    selected.push(chosen);
    for (const genre of chosen.matchedFavoriteGenres ?? []) usedGenres.add(genre);
  }

  return selected.sort((a, b) => b.score - a.score);
}

async function syncAllMovies() {
  if (!apiKey()) {
    console.warn('[TMDB] TMDB_API_KEY não configurada; sincronização ignorada.');
    return { synced: 0, skipped: 0, failed: 0 };
  }

  const movies = (await pool.query(`
    SELECT id, name, tmdb_synced_at
    FROM movies
    WHERE tmdb_synced_at IS NULL
       OR tmdb_synced_at < CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day')
    ORDER BY id ASC
  `, [SYNC_AFTER_DAYS])).rows;

  let synced = 0;
  let failed = 0;
  for (const movie of movies) {
    try {
      const metadata = await lookupMovie(movie.name);
      await pool.query(`
        UPDATE movies
        SET tmdb_id = $2,
            tmdb_media_type = $3,
            genres = $4,
            category = $5,
            tmdb_synced_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [movie.id, metadata.tmdbId, metadata.mediaType, metadata.genres, metadata.category]);
      synced++;
      console.log(`[TMDB] ${movie.name} → ${metadata.category}`);
    } catch (error) {
      failed++;
      console.error(`[TMDB] Falha em "${movie.name}":`, error.message);
    }
  }
  return { synced, skipped: 0, failed };
}

module.exports = {
  syncAllMovies, lookupMovie, findTitle, getDetails, getSimilar, getRecommendations,
};