const pool = require('./pgPool');

const API_BASE = 'https://api.themoviedb.org/3';
const SYNC_AFTER_DAYS = 30;
const genreCache = new Map();

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
  for (const genre of [...(movies.genres ?? []), ...(tv.genres ?? [])]) {
    genres.set(genre.id, genre.name);
  }
  genreCache.set(language, genres);
  return genres;
}

async function findTitle(title, language = 'pt-BR') {
  const result = await tmdbFetch('/search/multi', {
    query: title,
    language,
    include_adult: 'false',
    page: 1,
  });

  const candidates = (result.results ?? [])
    .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
    .map(item => ({ item, score: similarity(title, item.title ?? item.name) }))
    .sort((a, b) => b.score - a.score);

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
    return { tmdbId: null, genres: [], category: 'Outros' };
  }

  const names = (item.genre_ids ?? [])
    .map(id => genres.get(id))
    .filter(Boolean);
  return {
    tmdbId: item.id ?? null,
    genres: [...new Set(names)],
    category: names[0] ?? 'Outros',
  };
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
            genres = $3,
            category = $4,
            tmdb_synced_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [movie.id, metadata.tmdbId, metadata.genres, metadata.category]);
      synced++;
      console.log(`[TMDB] ${movie.name} → ${metadata.category}`);
    } catch (error) {
      failed++;
      console.error(`[TMDB] Falha em "${movie.name}":`, error.message);
    }
  }
  return { synced, skipped: 0, failed };
}

module.exports = { syncAllMovies, lookupMovie };