const pool = require('./pgPool');

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tally_submissions (
      id            SERIAL        PRIMARY KEY,
      submission_id VARCHAR(100)  UNIQUE NOT NULL,
      form_name     VARCHAR(200),
      squad_name    VARCHAR(150),
      squad_name_norm VARCHAR(150),
      squad_tag     VARCHAR(50),
      manager_name  VARCHAR(150),
      uids          TEXT[]        NOT NULL DEFAULT '{}',
      raw_extras    JSONB         NOT NULL DEFAULT '[]',
      status        VARCHAR(20)   NOT NULL DEFAULT 'PENDENTE',
      received_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `);
  // migração: adiciona coluna status se não existir
  await pool.query(`
    ALTER TABLE tally_submissions ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE'
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tally_uids ON tally_submissions USING GIN(uids);
    CREATE INDEX IF NOT EXISTS idx_tally_squad ON tally_submissions(squad_name_norm);
  `);
}

// ─── Normalização ─────────────────────────────────────────────────────────────

function normText(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Salvar submissão ─────────────────────────────────────────────────────────

async function saveSubmission({ submissionId, formName, squadName, squadTag, managerName, managerDiscord, uids, rawExtras }) {
  // migração: adiciona coluna manager_discord se não existir
  await pool.query(`
    ALTER TABLE tally_submissions ADD COLUMN IF NOT EXISTS manager_discord VARCHAR(100) DEFAULT NULL
  `).catch(() => {});

  await pool.query(
    `INSERT INTO tally_submissions
       (submission_id, form_name, squad_name, squad_name_norm, squad_tag, manager_name, manager_discord, uids, raw_extras)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (submission_id) DO UPDATE SET
       form_name       = EXCLUDED.form_name,
       squad_name      = EXCLUDED.squad_name,
       squad_name_norm = EXCLUDED.squad_name_norm,
       squad_tag       = EXCLUDED.squad_tag,
       manager_name    = EXCLUDED.manager_name,
       manager_discord = EXCLUDED.manager_discord,
       uids            = EXCLUDED.uids,
       raw_extras      = EXCLUDED.raw_extras,
       received_at     = NOW()`,
    [
      submissionId,
      formName        ?? null,
      squadName       ?? null,
      normText(squadName),
      squadTag        ?? null,
      managerName     ?? null,
      managerDiscord  ?? null,
      uids,
      JSON.stringify(rawExtras ?? []),
    ]
  );
}

// ─── Detectar UIDs duplicados ─────────────────────────────────────────────────
// Retorna lista de { uid, submissionId, squadName, receivedAt } para cada UID duplicado

async function findDuplicateUIDs(uids, currentSubmissionId) {
  if (!uids || uids.length === 0) return [];

  const res = await pool.query(
    `SELECT s.submission_id, s.squad_name, s.manager_name, s.received_at,
            u.uid AS conflicting_uid
     FROM tally_submissions s,
          UNNEST(s.uids) AS u(uid)
     WHERE u.uid = ANY($1::text[])
       AND s.submission_id != $2
     ORDER BY s.received_at DESC`,
    [uids, currentSubmissionId]
  );
  return res.rows.map(r => ({
    uid:          r.conflicting_uid,
    submissionId: r.submission_id,
    squadName:    r.squad_name ?? '—',
    managerName:  r.manager_name ?? '—',
    receivedAt:   r.received_at,
  }));
}

// ─── Detectar ficha/squad duplicado ──────────────────────────────────────────
// Retorna lista de submissões com o mesmo nome de squad (normalizado)

async function findDuplicateSquad(squadName, currentSubmissionId) {
  if (!squadName) return [];
  const norm = normText(squadName);
  if (!norm) return [];

  const res = await pool.query(
    `SELECT submission_id, squad_name, manager_name, received_at
     FROM tally_submissions
     WHERE squad_name_norm = $1
       AND submission_id != $2
     ORDER BY received_at DESC`,
    [norm, currentSubmissionId]
  );
  return res.rows.map(r => ({
    submissionId: r.submission_id,
    squadName:    r.squad_name ?? '—',
    managerName:  r.manager_name ?? '—',
    receivedAt:   r.received_at,
  }));
}

// ─── Marcar submissão como rejeitada ─────────────────────────────────────────

async function flagAsRejected(submissionId) {
  await pool.query(
    `UPDATE tally_submissions SET status = 'REJEITADA' WHERE submission_id = $1`,
    [submissionId]
  );
}

// ─── Listar / filtrar submissões com paginação ────────────────────────────────

async function listar({ status = null, pagina = 1, porPagina = 5 } = {}) {
  const offset = (pagina - 1) * porPagina;
  const params = [];
  let where = '';

  if (status) {
    params.push(status);
    where = `WHERE status = $${params.length}`;
  }

  const [rowsRes, countRes] = await Promise.all([
    pool.query(
      `SELECT submission_id, form_name, squad_name, squad_tag, manager_name,
              manager_discord, uids, status, received_at
       FROM tally_submissions
       ${where}
       ORDER BY received_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, porPagina, offset]
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM tally_submissions ${where}`,
      params
    ),
  ]);

  return {
    rows:  rowsRes.rows,
    total: parseInt(countRes.rows[0].total, 10),
    pagina,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(parseInt(countRes.rows[0].total, 10) / porPagina)),
  };
}

// ─── Remover submissão ────────────────────────────────────────────────────────

async function remover(submissionId) {
  const res = await pool.query(
    `DELETE FROM tally_submissions WHERE submission_id = $1`,
    [submissionId]
  );
  return res.rowCount > 0;
}

module.exports = { init, saveSubmission, findDuplicateUIDs, findDuplicateSquad, flagAsRejected, listar, remover, normText, listarFiltrado: listar };
