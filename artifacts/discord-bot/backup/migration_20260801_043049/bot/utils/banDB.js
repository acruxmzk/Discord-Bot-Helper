const pool = require('./pgPool');

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banned_players (
      id        SERIAL      PRIMARY KEY,
      uid       VARCHAR(25) UNIQUE NOT NULL,
      nick      VARCHAR(60) NOT NULL DEFAULT '',
      reason    TEXT        NOT NULL,
      banned_by VARCHAR(60) NOT NULL DEFAULT 'STAFF',
      banned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // migração: adiciona coluna nick se não existir (bancos antigos)
  await pool.query(`
    ALTER TABLE banned_players ADD COLUMN IF NOT EXISTS nick VARCHAR(60) NOT NULL DEFAULT ''
  `);
}

async function banPlayer(uid, nick, reason, bannedBy = 'STAFF') {
  await pool.query(
    `INSERT INTO banned_players (uid, nick, reason, banned_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (uid) DO UPDATE SET
       nick      = EXCLUDED.nick,
       reason    = EXCLUDED.reason,
       banned_by = EXCLUDED.banned_by,
       banned_at = NOW()`,
    [uid.trim(), nick.trim(), reason.trim(), bannedBy]
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
    nick:     row.nick,
    reason:   row.reason,
    bannedAt: row.banned_at?.toISOString?.() ?? row.banned_at,
    bannedBy: row.banned_by,
  };
}

async function listBans(limit = 200) {
  const res = await pool.query(
    `SELECT * FROM banned_players ORDER BY banned_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows;
}

async function searchBans(query) {
  const res = await pool.query(
    `SELECT * FROM banned_players
     WHERE uid ILIKE $1 OR nick ILIKE $1
     ORDER BY banned_at DESC LIMIT 25`,
    [`%${query.trim()}%`]
  );
  return res.rows;
}

async function checkPlayerByNick(nick) {
  const res = await pool.query(
    `SELECT * FROM banned_players WHERE nick ILIKE $1 LIMIT 1`,
    [nick.trim()]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return { uid: row.uid, nick: row.nick, reason: row.reason, bannedBy: row.banned_by, bannedAt: row.banned_at };
}

module.exports = { init, banPlayer, unbanPlayer, checkPlayer, checkPlayerByNick, listBans, searchBans };
