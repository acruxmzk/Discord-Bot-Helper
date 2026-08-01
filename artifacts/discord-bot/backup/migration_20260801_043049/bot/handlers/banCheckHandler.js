const { checkPlayer }        = require('../utils/banDB');
const { notifyBanDetected }  = require('../utils/staffAlert');

// ── Normaliza texto Unicode bold (𝗨𝗜𝗗 → UID, 𝟭 → 1, etc.) ──────────────────
function normalizeText(text) {
  return text.normalize('NFKC');
}

// ── Extrai UIDs de mensagem de texto livre ────────────────────────────────────
function extractUIDs(content) {
  const normalized = normalizeText(content);
  const fromLabel  = [...normalized.matchAll(/uid\s*:\s*(\d{6,20})/gi)];
  const standalone = [...normalized.matchAll(/(?<![.\d])(\d{8,20})(?![.\d])/g)];
  const all = [
    ...fromLabel.map(m => m[1]),
    ...standalone.map(m => m[1]),
  ];
  return [...new Set(all.map(u => u.trim()))];
}

// ── Handler principal — monitora mensagens em canais de ticket ────────────────
async function handleBanCheck(message) {
  if (message.author.bot) return;
  if (!message.channel.name?.startsWith('ticket-')) return;

  const uids = extractUIDs(message.content);
  console.log(`[BAN-CHECK] Canal: ${message.channel.name} | UIDs extraídos: [${uids.join(', ') || 'nenhum'}]`);
  if (uids.length === 0) return;

  const banidos = uids
    .map(uid => ({ uid, result: checkPlayer(uid) }))
    .filter(({ result }) => result.status === 'BANIDO');

  if (banidos.length === 0) return;

  console.log(`[BAN-CHECK] 🚨 Banidos detectados: [${banidos.map(b => b.uid).join(', ')}]`);

  await notifyBanDetected({
    guild:         message.guild,
    ticketChannel: message.channel,
    sender:        message.author,
    banidos,
  });
}

module.exports = { handleBanCheck };
