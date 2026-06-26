const pool = require('./pgPool');

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS faq_config (
      guild_id   VARCHAR(30) PRIMARY KEY,
      channel_id VARCHAR(30) NOT NULL,
      set_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function setChannel(guildId, channelId) {
  await pool.query(
    `INSERT INTO faq_config (guild_id, channel_id)
     VALUES ($1, $2)
     ON CONFLICT (guild_id) DO UPDATE SET
       channel_id = EXCLUDED.channel_id,
       set_at     = NOW()`,
    [guildId, channelId]
  );
}

async function getChannel(guildId) {
  const res = await pool.query(
    `SELECT channel_id FROM faq_config WHERE guild_id = $1`,
    [guildId]
  );
  return res.rows[0]?.channel_id ?? null;
}

module.exports = { init, setChannel, getChannel };
