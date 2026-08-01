const pool = require('./pgPool');

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS movie_panel (
      guild_id   VARCHAR(30) PRIMARY KEY,
      channel_id VARCHAR(30) NOT NULL,
      message_id VARCHAR(30) NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function savePanel(guildId, channelId, messageId) {
  await pool.query(
    `INSERT INTO movie_panel (guild_id, channel_id, message_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (guild_id) DO UPDATE SET
       channel_id = EXCLUDED.channel_id,
       message_id = EXCLUDED.message_id,
       updated_at = NOW()`,
    [guildId, channelId, messageId]
  );
}

async function getPanel(guildId) {
  const res = await pool.query(
    `SELECT * FROM movie_panel WHERE guild_id = $1`,
    [guildId]
  );
  return res.rows[0] ?? null;
}

module.exports = { init, savePanel, getPanel };
