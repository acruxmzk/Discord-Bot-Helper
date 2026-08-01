// ── Utilitário compartilhado de alertas de staff ──────────────────────────────
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ChannelType,
} = require('discord.js');
const { ticketLogChannelName } = require('../config/config');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function gap() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

// ── Localiza o canal de log — usa config como fonte da verdade ────────────────
function findLogChannel(guild) {
  return guild.channels.cache.find(
    c => c.type === ChannelType.GuildText &&
         c.name.toLowerCase().replace(/[^a-z0-9-]/g, '').includes(
           ticketLogChannelName.toLowerCase()
         )
  ) ?? guild.channels.cache.find(
    c => c.type === ChannelType.GuildText &&
         (c.name.toLowerCase().includes('staff-log') ||
          c.name.toLowerCase().includes('staff-logs') ||
          c.name.toLowerCase().includes('log'))
  ) ?? null;
}

// ── Localiza a role STAFF ─────────────────────────────────────────────────────
async function getStaffMention(guild) {
  await guild.roles.fetch().catch(() => {});
  const role = guild.roles.cache.find(r => r.name.toLowerCase() === 'staff');
  return role ? `<@&${role.id}>` : '@STAFF';
}

// ── Dispara alerta de UID banido ──────────────────────────────────────────────
// banidos = [{ uid, result: { status, reason, bannedAt, bannedBy } }]
async function notifyBanDetected({ guild, ticketChannel, sender, banidos }) {
  if (!banidos || banidos.length === 0) return;

  const linhas = banidos.map(({ uid, result }) =>
    `🚨  \`${uid}\`\n> **Motivo:** ${result.reason}\n> **Banido em:** ${result.bannedAt}`
  ).join('\n\n');

  // ── Alerta dentro do ticket ───────────────────────────────────────────────
  if (ticketChannel) {
    await ticketChannel.send({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(txt(`### 🚨  UID BANIDO DETECTADO NA INSCRIÇÃO`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(linhas))
          .addSeparatorComponents(gap())
          .addTextDisplayComponents(txt(`-# ⛔ A staff foi notificada. Esta inscrição não será aceita.`)),
      ],
      flags: MessageFlags.IsComponentsV2,
    }).catch(e => console.error('[ALERT] Falha ao enviar no ticket:', e.message));
  }

  // ── Alerta no canal de staff log com ping ─────────────────────────────────
  const logCh = findLogChannel(guild);
  console.log(`[ALERT] Canal de log encontrado: ${logCh ? logCh.name : 'NENHUM'}`);

  if (logCh) {
    const staffMention = await getStaffMention(guild);
    const resumo = banidos.map(({ uid, result }) =>
      `**UID:** \`${uid}\`\n**Motivo:** ${result.reason}\n**Data do ban:** ${result.bannedAt}`
    ).join('\n\n');

    const senderInfo = sender
      ? `**Enviado por:** <@${sender.id}> \`${sender.tag}\`\n`
      : '';

    const channelInfo = ticketChannel
      ? `**Canal:** <#${ticketChannel.id}>\n`
      : '';

    await logCh.send({
      content: staffMention,
      components: [
        new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(txt(`### 🚨  PLAYER BANIDO DETECTADO`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            channelInfo + senderInfo + '\n' + resumo
          ))
          .addSeparatorComponents(gap())
          .addTextDisplayComponents(txt(`-# Verifique o ticket e tome as providências necessárias.`)),
      ],
      flags: MessageFlags.IsComponentsV2,
    }).catch(e => console.error('[ALERT] Falha ao enviar no log:', e.message));
  }
}

module.exports = { findLogChannel, getStaffMention, notifyBanDetected };
