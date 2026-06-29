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
];

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS movies (
      id         SERIAL       PRIMARY KEY,
      name       VARCHAR(200) UNIQUE NOT NULL,
      watched    BOOLEAN      NOT NULL DEFAULT false,
      note       NUMERIC(4,1),
      watched_at DATE
    )
  `);

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
    `SELECT * FROM movies WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [name]
  );
  return res.rows[0] ?? null;
}

async function search(query) {
  const res = await pool.query(
    `SELECT * FROM movies WHERE name ILIKE $1 ORDER BY id ASC LIMIT 25`,
    [`%${query}%`]
  );
  return res.rows;
}

async function markWatched(name) {
  const res = await pool.query(
    `WITH before AS (
       SELECT watched FROM movies WHERE LOWER(name) = LOWER($1)
     )
     UPDATE movies SET
       watched    = true,
       watched_at = CASE WHEN (SELECT watched FROM before) THEN watched_at ELSE CURRENT_DATE END
     WHERE LOWER(name) = LOWER($1)
     RETURNING *, (SELECT watched FROM before) AS already_watched`,
    [name]
  );
  return res.rows[0] ?? null;
}

async function setNote(name, note) {
  const res = await pool.query(
    `UPDATE movies SET note = $2
     WHERE LOWER(name) = LOWER($1)
     RETURNING *`,
    [name, note]
  );
  return res.rows[0] ?? null;
}

async function addMovie(name) {
  const res = await pool.query(
    `INSERT INTO movies (name) VALUES ($1)
     ON CONFLICT (name) DO NOTHING
     RETURNING *`,
    [name.trim()]
  );
  return res.rows[0] ?? null;
}

async function removeMovie(name) {
  const res = await pool.query(
    `DELETE FROM movies WHERE LOWER(name) = LOWER($1) RETURNING *`,
    [name]
  );
  return res.rows[0] ?? null;
}

module.exports = { init, getAll, getByName, search, markWatched, setNote, addMovie, removeMovie };
