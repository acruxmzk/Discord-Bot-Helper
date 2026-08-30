const { MessageFlags } = require('discord.js');
const clientRef  = require('./clientRef');
const { getPanel }  = require('./panelStore');
const { getAll }    = require('./movieDB');
const { buildPanelContainer } = require('./buildPanelContainer');

function isMoviePanelMessage(message, client) {
  if (!message || message.author?.id !== client.user?.id) return false;
  return JSON.stringify(message.components ?? []).includes('painel:all');
}

async function findExistingPanel(client, guildId, preferredChannelId) {
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return null;

  const channels = await guild.channels.fetch().catch(() => guild.channels.cache);
  const orderedChannels = [...channels.values()]
    .filter(channel => channel?.isTextBased?.() && channel.messages?.fetch)
    .sort((a, b) => {
      if (a.id === preferredChannelId) return -1;
      if (b.id === preferredChannelId) return 1;
      return 0;
    });

  for (const channel of orderedChannels) {
    const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
    const panelMessage = messages
      ? [...messages.values()].find(message => isMoviePanelMessage(message, client))
      : null;
    if (panelMessage) return { channel, message: panelMessage };
  }
  return null;
}

async function refreshPanel(guildId, preferredChannelId = null) {
  const client = clientRef.get();
  if (!client) return false;

  let panel = await getPanel(guildId).catch(error => {
    console.error('[PANEL] Falha ao localizar painel:', error.message);
    return null;
  });

  try {
    let channel;
    let message;

    if (panel) {
      channel = await client.channels.fetch(panel.channel_id).catch(() => null);
      message = channel
        ? await channel.messages.fetch(panel.message_id).catch(() => null)
        : null;
    }

    // Recupera painéis criados antes de o registro ser salvo ou depois de
    // uma reinicialização da base. Isso permite que os comandos continuem
    // funcionando sem exigir um novo clique no painel.
    if (!message) {
      const existing = await findExistingPanel(client, guildId, preferredChannelId);
      if (!existing) {
        console.warn(`[PANEL] Nenhum painel encontrado para o servidor ${guildId}; use /painel uma vez.`);
        return false;
      }
      channel = existing.channel;
      message = existing.message;
      const { savePanel } = require('./panelStore');
      await savePanel(guildId, channel.id, message.id);
    }

    const movies = await getAll();
    const container = buildPanelContainer(movies, 'all');

    await message.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
    return true;
  } catch (err) {
    console.error('[PANEL] Falha ao atualizar:', err.message, err.stack);
    return false;
  }
}

module.exports = { refreshPanel };
