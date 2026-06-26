const { MessageFlags } = require('discord.js');
const clientRef  = require('./clientRef');
const { getPanel }  = require('./panelStore');
const { getAll }    = require('./movieDB');
const { buildPanelContainer } = require('./buildPanelContainer');

async function refreshPanel(guildId) {
  const client = clientRef.get();
  if (!client) return;

  const panel = await getPanel(guildId).catch(() => null);
  if (!panel) return;

  try {
    const channel = await client.channels.fetch(panel.channel_id).catch(() => null);
    if (!channel) return;

    const message = await channel.messages.fetch(panel.message_id).catch(() => null);
    if (!message) return;

    const movies    = await getAll();
    const container = buildPanelContainer(movies, 'all');

    await message.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (err) {
    console.warn('[PANEL] Falha ao atualizar:', err.message);
  }
}

module.exports = { refreshPanel };
