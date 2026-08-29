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

async function searchCandidates(query, language, preferSeries = false) {
  const likelySeries = preferSeries || /\b(season|temporada|s[ée]rie|programa)\b/i.test(query);
  const result = await tmdbFetch(likelySeries ? '/search/tv' : '/search/multi', {
    query,
    language,
    include_adult: 'false',
    page: 1,
  });
  return (result.results ?? [])
    .filter(item => likelySeries || item.media_type === 'movie' || item.media_type === 'tv')
    .map(item => {
      const mediaType = item.media_type ?? (likelySeries ? 'tv' : 'movie');
      const localized = item.title ?? item.name ?? '';
      const original = item.original_title ?? item.original_name ?? '';
      let score = similarity(query, localized);
      if (cleanTitle(localized) === cleanTitle(query)) score = 1;
      else if (cleanTitle(original) === cleanTitle(query)) score = Math.max(score, 0.84);
      if (likelySeries && mediaType === 'tv') score += 0.4;
      if (likelySeries && mediaType === 'movie') score -= 0.2;
      // For ambiguous names such as "Os Vingadores", prefer a movie match
      // over an old TV series when the watchlist is a film list.
      if (mediaType === 'movie') score += 0.15;
      score += Math.min(Number(item.popularity ?? 0) / 1000, 0.05);
      return { item: { ...item, media_type: mediaType }, score };
    });
}

async function findTitle(title, language = 'pt-BR') {
  const queries = [title, ...(SEARCH_ALIASES[title] ?? [])];
  const preferSeries = /\b(season|temporada|s[ée]rie|programa)\b/i.test(title);
  const candidates = [];
  for (const query of queries) {
    candidates.push(...await searchCandidates(query, language, preferSeries));
  }
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
    return {
      tmdbId: null,
      mediaType: null,
      genres: [],
      category: 'Outros',
      runtimeMinutes: null,
      episodeRuntimeMinutes: null,
      episodeCount: null,
      seasonCount: null,
      durationMinutes: null,
    };
  }

  const names = (item.genre_ids ?? [])
    .map(id => genres.get(id))
    .filter(Boolean);
  const details = await getDetails({
    tmdb_id: item.id,
    tmdb_media_type: item.media_type,
  }, { append: '' });
  const seasonNumber = getSeasonNumber(title);
  let seasonDetails = null;
  if (item.media_type === 'tv' && seasonNumber !== null) {
    try {
      const candidate = await getSeasonDetails(item.id, seasonNumber);
      if (candidate?.episodes?.length) seasonDetails = candidate;
    } catch (error) {
      console.warn(`[TMDB] Temporada ${seasonNumber} não disponível para "${title}": ${error.message}`);
    }
  }
  const duration = durationFromDetails(details, item.media_type, seasonDetails);
  return {
    tmdbId: item.id ?? null,
    mediaType: item.media_type ?? null,
    genres: [...new Set(names)],
    category: GENRE_LABELS[names[0]] ?? names[0] ?? 'Outros',
    ...duration,
  };
}

function getSeasonNumber(title) {
  const match = String(title ?? '').match(/\b(?:season|temporada)\s*(\d+)\b/i);
  return match ? Number(match[1]) : null;
}

function durationFromDetails(details, mediaType, seasonDetails = null) {
  if (!details) {
    return {
      runtimeMinutes: null,
      episodeRuntimeMinutes: null,
      episodeCount: null,
      seasonCount: null,
      seasonNumber: null,
      durationMinutes: null,
    };
  }

  const isSeries = mediaType === 'tv' || details.number_of_episodes !== undefined;
  if (isSeries) {
    if (seasonDetails) {
      const episodes = seasonDetails.episodes ?? [];
      const runtimes = episodes
        .map(episode => Number(episode.runtime))
        .filter(value => Number.isFinite(value) && value > 0);
      const parentRuntimes = (details.episode_run_time ?? [])
        .map(Number)
        .filter(value => Number.isFinite(value) && value > 0);
      const episodeRuntimeMinutes = runtimes.length
        ? Math.round(runtimes.reduce((sum, value) => sum + value, 0) / runtimes.length)
        : parentRuntimes.length
          ? Math.round(parentRuntimes.reduce((sum, value) => sum + value, 0) / parentRuntimes.length)
          : null;
      const episodeCount = episodes.length || null;
      return {
        runtimeMinutes: null,
        episodeRuntimeMinutes,
        episodeCount,
        seasonCount: 1,
        seasonNumber: Number.isFinite(Number(seasonDetails.season_number))
          ? Number(seasonDetails.season_number)
          : null,
        durationMinutes: runtimes.length
          ? runtimes.reduce((sum, value) => sum + value, 0)
          : episodeRuntimeMinutes && episodeCount
            ? episodeRuntimeMinutes * episodeCount
            : null,
      };
    }

    const runtimes = (details.episode_run_time ?? [])
      .map(Number)
      .filter(value => Number.isFinite(value) && value > 0);
    const episodeRuntimeMinutes = runtimes.length
      ? Math.round(runtimes.reduce((sum, value) => sum + value, 0) / runtimes.length)
      : null;
    const episodeCount = Number.isFinite(Number(details.number_of_episodes)) && Number(details.number_of_episodes) > 0
      ? Number(details.number_of_episodes)
      : null;
    const seasonCount = Number.isFinite(Number(details.number_of_seasons)) && Number(details.number_of_seasons) > 0
      ? Number(details.number_of_seasons)
      : null;

    return {
      runtimeMinutes: null,
      episodeRuntimeMinutes,
      episodeCount,
      seasonCount,
      seasonNumber: null,
      durationMinutes: episodeRuntimeMinutes && episodeCount
        ? episodeRuntimeMinutes * episodeCount
        : null,
    };
  }

  const runtimeMinutes = Number(details.runtime);
  return {
    runtimeMinutes: Number.isFinite(runtimeMinutes) && runtimeMinutes > 0
      ? Math.round(runtimeMinutes)
      : null,
    episodeRuntimeMinutes: null,
    episodeCount: null,
    seasonCount: null,
    seasonNumber: null,
    durationMinutes: Number.isFinite(runtimeMinutes) && runtimeMinutes > 0
      ? Math.round(runtimeMinutes)
      : null,
  };
}

async function getDetails(movie, { append = 'credits,watch/providers' } = {}) {
  if (!movie?.tmdb_id) return null;
  const type = movie.tmdb_media_type === 'tv' ? 'tv' : 'movie';
  return tmdbFetch(`/${type}/${movie.tmdb_id}`, {
    language: 'pt-BR',
    append_to_response: append,
  });
}

async function getSeasonDetails(tmdbId, seasonNumber) {
  if (!tmdbId || !Number.isInteger(Number(seasonNumber)) || Number(seasonNumber) < 0) {
    return null;
  }
  return tmdbFetch(`/tv/${tmdbId}/season/${Number(seasonNumber)}`, {
    language: 'pt-BR',
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

async function saveTmdbMetadata(id, metadata) {
  const result = await pool.query(`
    UPDATE movies
    SET tmdb_id = $2,
        tmdb_media_type = $3,
        genres = $4,
        category = $5,
        runtime_minutes = $6,
        episode_runtime_minutes = $7,
        episode_count = $8,
        season_count = $9,
        season_number = $10,
        duration_minutes = $11,
        tmdb_synced_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `, [
    id,
    metadata.tmdbId ?? null,
    metadata.mediaType ?? null,
    metadata.genres ?? [],
    metadata.category ?? 'Outros',
    metadata.runtimeMinutes ?? null,
    metadata.episodeRuntimeMinutes ?? null,
    metadata.episodeCount ?? null,
    metadata.seasonCount ?? null,
    metadata.seasonNumber ?? null,
    metadata.durationMinutes ?? null,
  ]);
  return result.rows[0] ?? null;
}

async function syncMovie(movie) {
  if (!apiKey()) throw new Error('TMDB_API_KEY não configurada');
  const metadata = await lookupMovie(movie.name);
  const updated = await saveTmdbMetadata(movie.id, metadata);
  return { movie: updated, metadata };
}

async function syncAllMovies({ watchedOnly = false, force = false } = {}) {
  if (!apiKey()) {
    console.warn('[TMDB] TMDB_API_KEY não configurada; sincronização ignorada.');
    return { synced: 0, skipped: 0, failed: 0 };
  }

  const syncQuery = `
    SELECT id, name, tmdb_synced_at
    FROM movies
    WHERE ${watchedOnly ? 'watched AND' : ''}
      (${force ? 'TRUE' : `duration_minutes IS NULL
       OR tmdb_synced_at IS NULL
       OR tmdb_synced_at < CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day')`})
    ORDER BY id ASC
  `;
  const movies = (await pool.query(syncQuery, force ? [] : [SYNC_AFTER_DAYS])).rows;

  let synced = 0;
  let failed = 0;
  for (const movie of movies) {
    try {
      const metadata = await lookupMovie(movie.name);
      await saveTmdbMetadata(movie.id, metadata);
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
  syncAllMovies, syncMovie, lookupMovie, findTitle, getDetails, getSeasonDetails, durationFromDetails,
  getSimilar, getRecommendations,
};