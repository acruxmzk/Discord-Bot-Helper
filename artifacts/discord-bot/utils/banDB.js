const pool = require('./pgPool');

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banned_players (
      id        SERIAL      PRIMARY KEY,
      uid       VARCHAR(25) UNIQUE NOT NULL,
      reason    TEXT        NOT NULL,
      banned_by VARCHAR(60) NOT NULL DEFAULT 'STAFF',
      banned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function banPlayer(uid, reason, bannedBy = 'STAFF') {
  await pool.query(
    `INSERT INTO banned_players (uid, reason, banned_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (uid) DO UPDATE SET
       reason    = EXCLUDED.reason,
       banned_by = EXCLUDED.banned_by,
       banned_at = NOW()`,
    [uid.trim(), reason.trim(), bannedBy]
  );
}

async function unbanPlayer(uid) {
  const res = await pool.query(
    `DELETE FROM banned_players WHERE uid = $1`,
    [uid.trim()]
  );
  return res.rowCount > 0;
}

async function checkPlayer(uid) {
  const res = await pool.query(
    `SELECT * FROM banned_players WHERE uid = $1`,
    [uid.trim()]
  );
  if (res.rows.length === 0) return { status: 'LIMPO' };
  const row = res.rows[0];
  return {
    status:   'BANIDO',
    reason:   row.reason,
    bannedAt: row.banned_at?.toISOString?.() ?? row.banned_at,
    bannedBy: row.banned_by,
  };
}

async function listBans(limit = 25) {
  const res = await pool.query(
    `SELECT * FROM banned_players ORDER BY banned_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows;
}

async function searchBans(query) {
  const res = await pool.query(
    `SELECT * FROM banned_players WHERE uid LIKE $1 ORDER BY banned_at DESC LIMIT 10`,
    [`%${query.trim()}%`]
  );
  return res.rows;
}

module.exports = { init, banPlayer, unbanPlayer, checkPlayer, listBans, searchBans };
