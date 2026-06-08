const pool = require('./pgPool');

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inscricoes (
      id                SERIAL       PRIMARY KEY,
      registro_id       VARCHAR(25)  NOT NULL UNIQUE,
      status            VARCHAR(20)  NOT NULL DEFAULT 'PENDENTE',
      guild_id          VARCHAR(30)  NOT NULL,
      solicitante_id    VARCHAR(30)  NOT NULL,
      cla               VARCHAR(80)  NOT NULL,
      tag               VARCHAR(25)  NOT NULL,
      line              VARCHAR(60),
      manager           VARCHAR(60),
      tiktok            VARCHAR(100),
      jogadores         JSONB        NOT NULL DEFAULT '[]',
      ticket_channel_id VARCHAR(30),
      fichas_msg_id     VARCHAR(30),
      fichas_ch_id      VARCHAR(30),
      aprovado_por      VARCHAR(30),
      aprovado_em       TIMESTAMPTZ,
      rejeitado_por     VARCHAR(30),
      rejeitado_em      TIMESTAMPTZ,
      motivo_rejeicao   TEXT,
      observacoes       TEXT,
      criado_em         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      atualizado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
}

async function saveInscricao(data) {
  const {
    registroId, guildId, solicitanteId, cla, tag,
    line, manager, tiktok, jogadores, ticketChannelId,
  } = data;
  await pool.query(
    `INSERT INTO inscricoes
       (registro_id, guild_id, solicitante_id, cla, tag, line, manager, tiktok, jogadores, ticket_channel_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (registro_id) DO NOTHING`,
    [registroId, guildId, solicitanteId, cla, tag,
     line ?? null, manager ?? null, tiktok ?? null,
     JSON.stringify(jogadores), ticketChannelId ?? null]
  );
}

async function aprovar(registroId, aprovadoPor, fichasMsgId, fichasChId) {
  await pool.query(
    `UPDATE inscricoes
     SET status = 'APROVADA', aprovado_por = $2, aprovado_em = NOW(),
         fichas_msg_id = $3, fichas_ch_id = $4, atualizado_em = NOW()
     WHERE registro_id = $1`,
    [registroId, aprovadoPor, fichasMsgId ?? null, fichasChId ?? null]
  );
}

async function rejeitar(registroId, rejeitadoPor, motivo) {
  await pool.query(
    `UPDATE inscricoes
     SET status = 'REJEITADA', rejeitado_por = $2, rejeitado_em = NOW(),
         motivo_rejeicao = $3, atualizado_em = NOW()
     WHERE registro_id = $1`,
    [registroId, rejeitadoPor, motivo ?? null]
  );
}

async function buscar(query) {
  const q = query.trim();
  const res = await pool.query(
    `SELECT * FROM inscricoes
     WHERE registro_id ILIKE $1 OR cla ILIKE $1 OR tag ILIKE $1
     ORDER BY criado_em DESC LIMIT 10`,
    [`%${q}%`]
  );
  return res.rows;
}

async function listar(status = null, limit = 20) {
  if (status) {
    const res = await pool.query(
      `SELECT * FROM inscricoes WHERE status = $1 ORDER BY criado_em DESC LIMIT $2`,
      [status.toUpperCase(), limit]
    );
    return res.rows;
  }
  const res = await pool.query(
    `SELECT * FROM inscricoes ORDER BY criado_em DESC LIMIT $1`,
    [limit]
  );
  return res.rows;
}

async function getById(registroId) {
  const res = await pool.query(
    `SELECT * FROM inscricoes WHERE registro_id = $1`,
    [registroId]
  );
  return res.rows[0] ?? null;
}

async function atualizar(registroId, campos) {
  const sets = [];
  const vals = [];
  let i = 1;
  for (const [k, v] of Object.entries(campos)) {
    sets.push(`${k} = $${i++}`);
    vals.push(v);
  }
  sets.push(`atualizado_em = NOW()`);
  vals.push(registroId);
  await pool.query(
    `UPDATE inscricoes SET ${sets.join(', ')} WHERE registro_id = $${i}`,
    vals
  );
}

module.exports = { init, saveInscricao, aprovar, rejeitar, buscar, listar, getById, atualizar };
