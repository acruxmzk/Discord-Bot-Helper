const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ChannelType,
} = require('discord.js');
const { checkPlayer } = require('../utils/banDB');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function gap() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

// ── Normaliza texto Unicode bold (𝗨𝗜𝗗 → UID, 𝟭 → 1, etc.) ──────────────────
function normalizeText(text) {
  return text.normalize('NFKC');
}

// ── Extrai todos os UIDs de uma mensagem ──────────────────────────────────────
// Aceita: "UID: 123456", "𝗨𝗜𝗗: 123456", "uid:123456", "uid : 123456789", etc.
// Também captura qualquer sequência de 6-20 dígitos após "uid" ou sozinha
function extractUIDs(content) {
  const normalized = normalizeText(content);

  // Captura "uid: XXXX" (formato ficha)
  const fromLabel = [...normalized.matchAll(/uid\s*:\s*(\d{6,20})/gi)];

  // Fallback: qualquer número ≥ 6 dígitos que apareça isolado (sem estar no meio de outro texto)
  const standalone = [...normalized.matchAll(/(?<![.\d])(\d{8,20})(?![.\d])/g)];

  const all = [
    ...fromLabel.map(m => m[1]),
    ...standalone.map(m => m[1]),
  ];

  return [...new Set(all.map(u => u.trim()))];
}

// ── Localiza o canal de log de staff ─────────────────────────────────────────
function findLogChannel(guild) {
  return guild.channels.cache.find(
    c => c.type === ChannelType.GuildText &&
         (c.name.toLowerCase().includes('staff-log') ||
          c.name.toLowerCase().includes('logs') ||
          c.name.toLowerCase().includes('log'))
  ) ?? null;
}

// ── Handler principal ─────────────────────────────────────────────────────────
async function handleBanCheck(message) {
  // Só age em canais de ticket, ignora bots
  if (message.author.bot) return;
  if (!message.channel.name?.startsWith('ticket-')) return;

  const uids = extractUIDs(message.content);
  console.log(`[BAN-CHECK] Canal: ${message.channel.name} | UIDs extraídos: [${uids.join(', ') || 'nenhum'}]`);
  if (uids.length === 0) return;

  // Verifica cada UID extraído
  const banidos = uids
    .map(uid => ({ uid, result: checkPlayer(uid) }))
    .filter(({ result }) => result.status === 'BANIDO');

  if (banidos.length === 0) return;

  // ── Monta linhas de alerta ────────────────────────────────────────────────
  const linhas = banidos.map(({ uid, result }) =>
    `🚨  \`${uid}\`\n> **Motivo:** ${result.reason}\n> **Banido em:** ${result.bannedAt}`
  ).join('\n\n');

  // ── Alerta dentro do ticket ───────────────────────────────────────────────
  await message.channel.send({
    components: [
      new ContainerBuilder()
        .setAccentColor(0xFF0000)
        .addTextDisplayComponents(txt(
          `### 🚨  UID BANIDO DETECTADO NA INSCRIÇÃO`
        ))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(txt(linhas))
        .addSeparatorComponents(gap())
        .addTextDisplayComponents(txt(
          `-# ⛔ A staff foi notificada. Esta inscrição não será aceita.`
        )),
    ],
    flags: MessageFlags.IsComponentsV2,
  }).catch(() => {});

  // ── Alerta no canal de staff log com ping ─────────────────────────────────
  const logCh = findLogChannel(message.guild);
  if (logCh) {
    await message.guild.roles.fetch().catch(() => {});
    const staffRole   = message.guild.roles.cache.find(r => r.name.toLowerCase() === 'staff');
    const staffMention = staffRole ? `<@&${staffRole.id}>` : '@STAFF';

    const resumo = banidos.map(({ uid, result }) =>
      `**UID:** \`${uid}\`\n**Motivo:** ${result.reason}\n**Data do ban:** ${result.bannedAt}`
    ).join('\n\n');

    await logCh.send({
      content: staffMention,
      components: [
        new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(txt(
            `### 🚨  TENTATIVA DE INSCRIÇÃO COM UID BANIDO`
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `**Canal:** <#${message.channel.id}>\n` +
            `**Enviado por:** <@${message.author.id}> \`${message.author.tag}\`\n\n` +
            resumo
          ))
          .addSeparatorComponents(gap())
          .addTextDisplayComponents(txt(
            `-# Verifique o ticket e tome as providências necessárias.`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => {});
  }

  console.log(`[BAN-CHECK] UID(s) banido(s) detectado(s) em ${message.channel.name}: ${banidos.map(b => b.uid).join(', ')}`);
}

module.exports = { handleBanCheck };
