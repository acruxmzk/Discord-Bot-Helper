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

async function getRecommendations(movies) {
  const watched = movies
    .filter(movie => movie.watched && movie.tmdb_id)
    .sort((a, b) => Number(b.note ?? 0) - Number(a.note ?? 0))
    .slice(0, 3);
  if (!watched.length) return [];

  const existing = new Set(movies.map(movie => cleanTitle(movie.name)));
  const recommendations = [];
  const seen = new Set();
  for (const movie of watched) {
    const similar = await getSimilar(movie);
    for (const item of similar) {
      const title = item.title ?? item.name;
      if (!title || seen.has(item.id) || existing.has(cleanTitle(title))) continue;
      seen.add(item.id);
      recommendations.push({ ...item, source: movie.name });
    }
  }
  return recommendations
    .sort((a, b) => Number(b.vote_average ?? 0) - Number(a.vote_average ?? 0))
    .slice(0, 8);
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