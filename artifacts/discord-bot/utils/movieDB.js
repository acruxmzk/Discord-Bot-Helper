const pool = require('./pgPool');

const INITIAL_MOVIES = [
  'Capitão América: O Primeiro Vingador',
  'Homem de Ferro',
  'Homem de Ferro 2',
  'Thor',
  'Os Vingadores',
  'Thor: O Mundo Sombrio',
  'Homem de Ferro 3',
  'Capitão América: Soldado Invernal',
  'Guardiões da Galáxia',
  'Guardiões da Galáxia Vol. 2',
  'Vingadores: Era de Ultron',
  'Homem-Formiga',
  'Capitão América: Guerra Civil',
  'Viúva Negra',
  'Pantera Negra',
  'Homem-Aranha: De Volta ao Lar',
  'Doutor Estranho',
  'Thor: Ragnarok',
  'Homem-Formiga e a Vespa',
  'Vingadores: Guerra Infinita',
  'Vingadores: Ultimato',
  'Homem-Aranha: Longe de Casa',
  'Homem-Aranha: Sem Volta Para Casa',
  'Eternos',
  'Doutor Estranho no Multiverso da Loucura',
  'Pantera Negra: Wakanda Para Sempre',
  'Thor: Amor e Trovão',
  'Homem-Formiga e a Vespa: Quantumania',
  'Guardiões da Galáxia Vol. 3',
  'Deadpool & Wolverine',
  'Barbie:  A princesa da ilha',
  'Para todos os garotos que já amei',
  'Como Mágica',
  'Gato de botas 2',
  'Frozen',
  'Para todos os garotos que já amei 2',
  'Super-herói: o filme',
  'Como eu era antes de você',
  'Obsessão',
  'casamento sangrento',
  'Casamento sangrento 2',
  '12 horas para sobreviver',
  'Uma noite de crime',
  'Uma noite de crime: Anarquia',
  'O menu',
  '10 coisas que eu odeio em você',
  'Frozen 2',
  'Sorria',
  'Orgulho e preconceito',
  'Cruella',
  'Masterchef Brasil: Season 3',
  'Zootopia',
  'Rango',
  'Dexter: Season 1',
  'Masterchef Profissionais: Season 2',
  'Misterio no Mediterrâneo',
  'Misterio em Paris',
  'O homem de toronto',
  'Barbie: Escola de princesas',
  'Malévola',
  '2012',
  'Um contratempo',
  'Nosferatu',
];

async function init() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS movies (
      id         SERIAL       PRIMARY KEY,
      name       VARCHAR(200) UNIQUE NOT NULL,
      watched    BOOLEAN      NOT NULL DEFAULT false,
      note       NUMERIC(4,1),
      watched_at TIMESTAMP WITHOUT TIME ZONE,
      tmdb_id    INTEGER,
      tmdb_media_type VARCHAR(10),
      genres     TEXT[]       NOT NULL DEFAULT '{}',
      category   VARCHAR(80)  NOT NULL DEFAULT 'Outros',
       runtime_minutes INTEGER,
       episode_runtime_minutes INTEGER,
       episode_count INTEGER,
       season_count INTEGER,
       season_number INTEGER,
       duration_minutes INTEGER,
      tmdb_synced_at TIMESTAMP WITHOUT TIME ZONE
    )
  `);

  await pool.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_id INTEGER`);
  await pool.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_media_type VARCHAR(10)`);
  await pool.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS genres TEXT[] NOT NULL DEFAULT '{}'`);
  await pool.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS category VARCHAR(80) NOT NULL DEFAULT 'Outros'`);
  await pool.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS runtime_minutes INTEGER`);
  await pool.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS episode_runtime_minutes INTEGER`);
  await pool.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS episode_count INTEGER`);
  await pool.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS season_count INTEGER`);
  await pool.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS season_number INTEGER`);
  await pool.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS duration_minutes INTEGER`);
  await pool.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_synced_at TIMESTAMP WITHOUT TIME ZONE`);

  // Atualiza instalações antigas para registrar também o horário em que
  // o filme foi assistido. Datas já existentes continuam preservadas.
  await pool.query(`
    ALTER TABLE movies
    ALTER COLUMN watched_at TYPE TIMESTAMP WITHOUT TIME ZONE
    USING watched_at::timestamp
  `).catch(err => {
    // A coluna já está no tipo correto nas execuções seguintes.
    if (err.code !== '42804') throw err;
  });

  for (const name of INITIAL_MOVIES) {
    await pool.query(
      `INSERT INTO movies (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [name]
    );
  }
}

async function getAll() {
  const res = await pool.query(`SELECT * FROM movies ORDER BY id ASC`);
  return res.rows;
}

async function getByName(name) {
  const res = await pool.query(
    `SELECT * FROM movies WHERE LOWER(BTRIM(name)) = LOWER(BTRIM($1)) LIMIT 1`,
    [name ?? '']
  );
  return res.rows[0] ?? null;
}

async function getByTmdbId(tmdbId) {
  const res = await pool.query(
    `SELECT * FROM movies WHERE tmdb_id = $1 LIMIT 1`,
    [tmdbId]
  );
  return res.rows[0] ?? null;
}

async function updateTmdbMetadata(id, metadata) {
  const res = await pool.query(
    `UPDATE movies
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
      RETURNING *`,
    [
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
    ]
  );
  return res.rows[0] ?? null;
}

async function search(query) {
  const text = String(query ?? '').trim();
  const res = await pool.query(
    `SELECT * FROM movies
     WHERE unaccent(LOWER(name)) LIKE unaccent(LOWER($1))
     ORDER BY
       CASE
         WHEN $2 <> '' AND unaccent(LOWER(name)) = unaccent(LOWER($2)) THEN 0
         WHEN $2 <> '' AND unaccent(LOWER(name)) LIKE unaccent(LOWER($2)) || '%' THEN 1
         WHEN $2 <> '' THEN 2
         ELSE 3
       END,
       CASE WHEN $2 = '' THEN unaccent(LOWER(name)) ELSE name END ASC,
       id ASC
     LIMIT 25`,
    [`%${text}%`, text]
  );
  return res.rows;
}

async function markWatched(name) {
  const res = await pool.query(
    `WITH before AS (
       SELECT watched FROM movies
       WHERE unaccent(LOWER(BTRIM(name))) = unaccent(LOWER(BTRIM($1)))
     )
     UPDATE movies SET
       watched    = true,
       watched_at = CASE WHEN (SELECT watched FROM before) THEN watched_at ELSE CURRENT_TIMESTAMP END
      WHERE unaccent(LOWER(BTRIM(name))) = unaccent(LOWER(BTRIM($1)))
     RETURNING *, (SELECT watched FROM before) AS already_watched`,
    [name]
  );
  return res.rows[0] ?? null;
}

async function setNote(name, note) {
  const res = await pool.query(
    `UPDATE movies SET note = $2
      WHERE unaccent(LOWER(BTRIM(name))) = unaccent(LOWER(BTRIM($1)))
     RETURNING *`,
    [name, note]
  );
  return res.rows[0] ?? null;
}

async function addMovie(name) {
  const cleanName = String(name ?? '').trim().replace(/\s+/g, ' ');
  if (!cleanName) return null;

  const res = await pool.query(
    `INSERT INTO movies (name)
     SELECT $1::varchar
     WHERE NOT EXISTS (
       SELECT 1 FROM movies WHERE LOWER(BTRIM(name)) = LOWER(BTRIM($1::varchar))
     )
     RETURNING *`,
    [cleanName]
  );
  return res.rows[0] ?? null;
}

async function removeMovie(name) {
  const res = await pool.query(
    `DELETE FROM movies
     WHERE unaccent(LOWER(BTRIM(name))) = unaccent(LOWER(BTRIM($1)))
     RETURNING *`,
    [name]
  );
  return res.rows[0] ?? null;
}

module.exports = {
  init, getAll, getByName, getByTmdbId, updateTmdbMetadata,
  search, markWatched, setNote, addMovie, removeMovie,
};
