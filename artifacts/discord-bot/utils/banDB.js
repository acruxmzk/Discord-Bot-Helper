const Database = require('better-sqlite3');
const path     = require('path');

const db = new Database(path.join(__dirname, '..', 'data', 'oblivion.db'));

// ── Criar tabela se não existir ───────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS banned_players (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    uid       TEXT    UNIQUE NOT NULL,
    reason    TEXT    NOT NULL,
    banned_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    banned_by TEXT    NOT NULL DEFAULT 'STAFF'
  );
`);

// ── Banir (insert ou update) ───────────────────────────────────────────────────
function banPlayer(uid, reason, bannedBy = 'STAFF') {
  const stmt = db.prepare(`
    INSERT INTO banned_players (uid, reason, banned_at, banned_by)
    VALUES (?, ?, datetime('now', 'localtime'), ?)
    ON CONFLICT(uid) DO UPDATE SET
      reason    = excluded.reason,
      banned_at = excluded.banned_at,
      banned_by = excluded.banned_by
  `);
  stmt.run(uid.trim(), reason.trim(), bannedBy);
}

// ── Desbanir ──────────────────────────────────────────────────────────────────
function unbanPlayer(uid) {
  const stmt = db.prepare(`DELETE FROM banned_players WHERE uid = ?`);
  const info = stmt.run(uid.trim());
  return info.changes > 0;
}

// ── Verificar ─────────────────────────────────────────────────────────────────
function checkPlayer(uid) {
  const row = db.prepare(`SELECT * FROM banned_players WHERE uid = ?`).get(uid.trim());
  if (!row) return { status: 'LIMPO' };
  return {
    status:   'BANIDO',
    reason:   row.reason,
    bannedAt: row.banned_at,
    bannedBy: row.banned_by,
  };
}

// ── Listar todos ──────────────────────────────────────────────────────────────
function listBans(limit = 25) {
  return db.prepare(`
    SELECT * FROM banned_players ORDER BY banned_at DESC LIMIT ?
  `).all(limit);
}

// ── Buscar por UID parcial ────────────────────────────────────────────────────
function searchBans(query) {
  return db.prepare(`
    SELECT * FROM banned_players WHERE uid LIKE ? ORDER BY banned_at DESC LIMIT 10
  `).all(`%${query.trim()}%`);
}

module.exports = { banPlayer, unbanPlayer, checkPlayer, listBans, searchBans };
