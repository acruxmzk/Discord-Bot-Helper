const pool = require('./pgPool');

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS regulamento_config (
      chave          VARCHAR(50)  PRIMARY KEY,
      valor          TEXT         NOT NULL,
      atualizado_por VARCHAR(60),
      atualizado_em  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
}

async function get(chave) {
  const res = await pool.query(
    'SELECT valor FROM regulamento_config WHERE chave = $1',
    [chave]
  );
  return res.rows[0]?.valor ?? null;
}

async function getAll() {
  const res = await pool.query(
    'SELECT chave, valor, atualizado_por, atualizado_em FROM regulamento_config ORDER BY chave'
  );
  return Object.fromEntries(res.rows.map(r => [r.chave, r]));
}

async function set(chave, valor, atualizadoPor = null) {
  await pool.query(
    `INSERT INTO regulamento_config (chave, valor, atualizado_por)
     VALUES ($1, $2, $3)
     ON CONFLICT (chave) DO UPDATE SET
       valor          = EXCLUDED.valor,
       atualizado_por = EXCLUDED.atualizado_por,
       atualizado_em  = NOW()`,
    [chave, valor, atualizadoPor]
  );
}

module.exports = { init, get, getAll, set };
