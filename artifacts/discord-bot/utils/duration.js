function asPositiveInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
}

function formatMinutes(value) {
  const minutes = asPositiveInteger(value);
  if (!minutes) return null;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}min`;
}

function formatCompactMinutes(value) {
  const minutes = asPositiveInteger(value);
  if (!minutes) return null;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h${String(remainder).padStart(2, '0')}`;
}

function formatMovieDuration(movie) {
  const total = formatMinutes(movie?.duration_minutes);
  if (!total) return null;

  if (movie.tmdb_media_type !== 'tv') return total;

  const episode = formatMinutes(movie.episode_runtime_minutes);
  const episodes = asPositiveInteger(movie.episode_count);
  const seasons = asPositiveInteger(movie.season_count);
  const seasonNumber = asPositiveInteger(movie.season_number);
  const parts = [];
  if (episode) parts.push(`${episode}/ep`);
  if (episodes) parts.push(`${episodes} eps.`);
  if (seasonNumber) parts.push(`temp. ${seasonNumber}`);
  else if (seasons) parts.push(`${seasons} temp.`);
  parts.push(`total ${total}`);
  return parts.join(' · ');
}

function sumDurations(movies) {
  return movies.reduce((sum, movie) => {
    const minutes = asPositiveInteger(movie.duration_minutes);
    return sum + (minutes ?? 0);
  }, 0);
}

function countKnownDurations(movies) {
  return movies.filter(movie => asPositiveInteger(movie.duration_minutes)).length;
}

module.exports = {
  formatMinutes,
  formatCompactMinutes,
  formatMovieDuration,
  sumDurations,
  countKnownDurations,
};