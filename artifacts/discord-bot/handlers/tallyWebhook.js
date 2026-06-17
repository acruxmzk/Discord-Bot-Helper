const {
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const banDB = require('../utils/banDB');

// ─── Builders ─────────────────────────────────────────────────────────────────

const sep  = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap  = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt  = (s) => new TextDisplayBuilder().setContent(s);

// ─── Localizar canal de inscrições Tally ──────────────────────────────────────

const TALLY_CHANNEL_PATTERNS = [
  'inscricoes-tally', 'inscricoes_tally', 'inscricao-tally', 'inscricao_tally',
  'inscricoes tally', 'tally', 'inscricoes',
];

function normCh(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

function findTallyChannel(client) {
  for (const guild of client.guilds.cache.values()) {
    for (const channel of guild.channels.cache.values()) {
      const name = normCh(channel.name ?? '');
      if (TALLY_CHANNEL_PATTERNS.some(p => name.includes(p))) return channel;
    }
  }
  return null;
}

// ─── Parsing do payload Tally ─────────────────────────────────────────────────
// O Tally envia: { eventType, data: { formName, fields: [{ label, type, value }] } }

const UID_REGEX = /^\d{6,12}$/;

function parseTallyPayload(body) {
  const fields = body?.data?.fields ?? [];
  const formName = body?.data?.formName ?? 'Formulário Tally';
  const submissionId = body?.data?.submissionId ?? body?.data?.responseId ?? '—';

  const result = {
    formName,
    submissionId,
    uids: [],       // { label, uid }
    extras: [],     // { label, value } — outros campos relevantes
  };

  for (const field of fields) {
    const label = (field.label ?? '').trim();
    const type  = field.type ?? '';
    const raw   = field.value;

    // Ignora campos vazios ou de estrutura
    if (!raw || type === 'FORM_TITLE' || type === 'HIDDEN_FIELDS') continue;

    const value = Array.isArray(raw) ? raw.join(', ') : String(raw).trim();
    if (!value || value === 'undefined') continue;

    const labelLow = label.toLowerCase();

    // Detecta campo de UID: label contém "uid" ou valor é só dígitos (6-12)
    if (labelLow.includes('uid') || labelLow.includes('id do jogador') || UID_REGEX.test(value)) {
      result.uids.push({ label, uid: value.replace(/\s/g, '') });
    } else {
      // Campos extras úteis (clã, tag, manager, tiktok, etc.)
      result.extras.push({ label, value });
    }
  }

  return result;
}

// ─── Verificação de UIDs ──────────────────────────────────────────────────────

async function verificarUIDs(uids) {
  return Promise.all(
    uids.map(async ({ label, uid }) => {
      try {
        const check = await banDB.checkPlayer(uid);
        return { label, uid, ...check };
      } catch {
        return { label, uid, status: 'ERRO' };
      }
    })
  );
}

// ─── Montar container Discord ─────────────────────────────────────────────────

function buildTallyContainer(parsed, checks) {
  const temBanido = checks.some(c => c.status === 'BANIDO');
  const color     = temBanido ? 0xFF4444 : 0x57F287;

  const header    = temBanido
    ? '🚨 **INSCRIÇÃO COM UID BANIDO DETECTADO**'
    : '✅ **Inscrição recebida — todos os UIDs estão limpos**';

  const builder = new ContainerBuilder()
    .setAccentColor(color)
    .addTextDisplayComponents(txt(header))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      `📋 **Formulário:** ${parsed.formName}\n` +
      `-# 🆔 Submissão: \`${parsed.submissionId}\``
    ));

  // Dados extras do squad (clã, tag, manager…)
  if (parsed.extras.length > 0) {
    builder.addSeparatorComponents(sep());
    const extraLines = parsed.extras
      .slice(0, 10)
      .map(e => `**${e.label}:** ${e.value}`)
      .join('\n');
    builder.addTextDisplayComponents(txt(extraLines));
  }

  // Resultados dos UIDs
  builder.addSeparatorComponents(sep());

  const uidLines = checks.map(c => {
    if (c.status === 'BANIDO') {
      const dataFormatada = c.bannedAt
        ? new Date(c.bannedAt).toLocaleDateString('pt-BR')
        : '—';
      return (
        `🔴 **UID \`${c.uid}\`** — ${c.label}\n` +
        `> ⛔ **BANIDO** · Motivo: ${c.reason}\n` +
        `> 📅 Banido em: ${dataFormatada} · Por: ${c.bannedBy}`
      );
    }
    if (c.status === 'ERRO') {
      return `⚠️ **UID \`${c.uid}\`** — ${c.label}\n> Erro ao verificar`;
    }
    return `🟢 **UID \`${c.uid}\`** — ${c.label} · Limpo`;
  });

  builder.addTextDisplayComponents(txt(uidLines.join('\n\n') || '_(nenhum UID encontrado no formulário)_'));

  if (temBanido) {
    builder.addSeparatorComponents(sep());
    builder.addTextDisplayComponents(txt(
      '⚠️ **Ação necessária:** Revise esta inscrição antes de aprovar.\n' +
      '-# Jogador(es) com restrição de participação na Oblivion League.'
    ));
  }

  builder
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt('-# 🌐 Oblivion League · Integração Tally Automática'));

  return builder;
}

// ─── Handler principal do webhook ─────────────────────────────────────────────

async function handleTallyWebhook(req, res, client) {
  try {
    const body = req.body;

    // Só processa respostas de formulário
    if (body?.eventType && body.eventType !== 'FORM_RESPONSE') {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const parsed = parseTallyPayload(body);
    console.log(`[TALLY] Formulário: "${parsed.formName}" | UIDs: ${parsed.uids.length} | Submissão: ${parsed.submissionId}`);

    // Verificar UIDs no banco
    const checks = await verificarUIDs(parsed.uids);

    // Logar bans detectados
    const banidos = checks.filter(c => c.status === 'BANIDO');
    if (banidos.length > 0) {
      console.warn(`[TALLY] ⚠️ BANIDO(S) detectado(s): ${banidos.map(b => b.uid).join(', ')}`);
    }

    // Encontrar canal e enviar
    const channel = findTallyChannel(client);
    if (!channel) {
      console.warn('[TALLY] Canal de inscrições-tally não encontrado no servidor.');
      return res.status(200).json({ ok: true, warn: 'canal_nao_encontrado' });
    }

    const container = buildTallyContainer(parsed, checks);
    await channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    res.status(200).json({ ok: true, uids: checks.length, banidos: banidos.length });
  } catch (err) {
    console.error('[TALLY] Erro ao processar webhook:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = { handleTallyWebhook };
