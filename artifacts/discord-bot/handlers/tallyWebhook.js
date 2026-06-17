const {
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const banDB   = require('../utils/banDB');
const tallyDB = require('../utils/tallyDB');

// ─── Builders ─────────────────────────────────────────────────────────────────

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = (s) => new TextDisplayBuilder().setContent(s);

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

const UID_REGEX = /^\d{6,12}$/;

// Palavras-chave por campo do squad
const SQUAD_FIELD = {
  name:    ['cla', 'clan', 'squad', 'equipe', 'time', 'nome do time', 'nome da equipe', 'nome do squad'],
  tag:     ['tag', 'sigla'],
  manager: ['manager', 'capita', 'lider', 'responsavel', 'nome da manager', 'nome da capitã'],
};

function classifyExtra(label) {
  const l = tallyDB.normText(label);
  for (const [field, keywords] of Object.entries(SQUAD_FIELD)) {
    if (keywords.some(k => l.includes(k))) return field;
  }
  return 'other';
}

function parseTallyPayload(body) {
  const fields       = body?.data?.fields ?? [];
  const formName     = body?.data?.formName ?? 'Formulário Tally';
  const submissionId = body?.data?.submissionId ?? body?.data?.responseId ?? String(Date.now());

  const result = {
    formName,
    submissionId,
    squadName:   null,
    squadTag:    null,
    managerName: null,
    uids:   [],   // { label, uid }
    extras: [],   // { label, value } — todos os campos não-UID
  };

  for (const field of fields) {
    const label = (field.label ?? '').trim();
    const type  = field.type ?? '';
    const raw   = field.value;

    if (!raw || type === 'FORM_TITLE' || type === 'HIDDEN_FIELDS') continue;

    const value = Array.isArray(raw) ? raw.join(', ') : String(raw).trim();
    if (!value || value === 'undefined') continue;

    const labelLow = label.toLowerCase();

    // UID: label contém "uid" / "id do jogador" OU valor é só números (6-12 dígitos)
    if (labelLow.includes('uid') || labelLow.includes('id do jogador') || UID_REGEX.test(value)) {
      result.uids.push({ label, uid: value.replace(/\s/g, '') });
      continue;
    }

    // Classifica campo do squad
    const kind = classifyExtra(label);
    if (kind === 'name'    && !result.squadName)   result.squadName   = value;
    if (kind === 'tag'     && !result.squadTag)    result.squadTag    = value;
    if (kind === 'manager' && !result.managerName) result.managerName = value;

    result.extras.push({ label, value });
  }

  return result;
}

// ─── Verificações ─────────────────────────────────────────────────────────────

async function verificarTudo(parsed) {
  const uidList = parsed.uids.map(u => u.uid);

  const [banChecks, dupUIDs, dupSquad] = await Promise.all([
    // 1. Checar bans
    Promise.all(parsed.uids.map(async ({ label, uid }) => {
      try {
        const check = await banDB.checkPlayer(uid);
        return { label, uid, ...check };
      } catch {
        return { label, uid, status: 'ERRO' };
      }
    })),
    // 2. UIDs duplicados em outras submissões
    tallyDB.findDuplicateUIDs(uidList, parsed.submissionId),
    // 3. Squad com mesmo nome
    tallyDB.findDuplicateSquad(parsed.squadName, parsed.submissionId),
  ]);

  return { banChecks, dupUIDs, dupSquad };
}

// ─── Montar container Discord ─────────────────────────────────────────────────

function buildTallyContainer(parsed, banChecks, dupUIDs, dupSquad) {
  const temBanido  = banChecks.some(c => c.status === 'BANIDO');
  const temDupUID  = dupUIDs.length > 0;
  const temDupSquad= dupSquad.length > 0;
  const temProblema = temBanido || temDupUID || temDupSquad;

  // ── Cor e cabeçalho ──────────────────────────────────────────────────────
  let color, header;
  if (temBanido && (temDupUID || temDupSquad)) {
    color  = 0xFF0000;
    header = '🚨 **ATENÇÃO: UID BANIDO + DUPLICATA DETECTADA**';
  } else if (temBanido) {
    color  = 0xFF4444;
    header = '🚨 **INSCRIÇÃO COM UID BANIDO DETECTADO**';
  } else if (temDupUID || temDupSquad) {
    color  = 0xFF8C00;
    header = '⚠️ **INSCRIÇÃO COM DUPLICATA DETECTADA**';
  } else {
    color  = 0x57F287;
    header = '✅ **Inscrição recebida — sem irregularidades**';
  }

  const builder = new ContainerBuilder()
    .setAccentColor(color)
    .addTextDisplayComponents(txt(header))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      `📋 **Formulário:** ${parsed.formName}\n` +
      `-# 🆔 Submissão: \`${parsed.submissionId}\``
    ));

  // ── Dados do squad ───────────────────────────────────────────────────────
  const squadInfo = [];
  if (parsed.squadName)   squadInfo.push(`🏟️ **Squad:** ${parsed.squadName}`);
  if (parsed.squadTag)    squadInfo.push(`🏷️ **Tag:** ${parsed.squadTag}`);
  if (parsed.managerName) squadInfo.push(`👤 **Manager:** ${parsed.managerName}`);

  // Outros extras
  const otherExtras = parsed.extras.filter(e => {
    const kind = classifyExtra(e.label);
    return kind === 'other';
  });

  if (squadInfo.length > 0 || otherExtras.length > 0) {
    builder.addSeparatorComponents(sep());
    const lines = [
      ...squadInfo,
      ...otherExtras.slice(0, 6).map(e => `**${e.label}:** ${e.value}`),
    ].join('\n');
    builder.addTextDisplayComponents(txt(lines));
  }

  // ── Resultado dos UIDs (ban check) ───────────────────────────────────────
  builder.addSeparatorComponents(sep());

  const uidLines = banChecks.map(c => {
    const isDupThisUID = dupUIDs.some(d => d.uid === c.uid);
    const dupTag = isDupThisUID ? ' 🔁 **DUP**' : '';

    if (c.status === 'BANIDO') {
      const dt = c.bannedAt ? new Date(c.bannedAt).toLocaleDateString('pt-BR') : '—';
      return (
        `🔴 **UID \`${c.uid}\`** — ${c.label}${dupTag}\n` +
        `> ⛔ **BANIDO** · Motivo: ${c.reason}\n` +
        `> 📅 ${dt} · Por: ${c.bannedBy}`
      );
    }
    if (c.status === 'ERRO') {
      return `⚠️ **UID \`${c.uid}\`** — ${c.label}${dupTag}\n> Erro ao verificar`;
    }
    return `🟢 **UID \`${c.uid}\`** — ${c.label}${dupTag} · Limpo`;
  });

  builder.addTextDisplayComponents(txt(
    uidLines.join('\n\n') || '_(nenhum UID encontrado no formulário)_'
  ));

  // ── Duplicatas de UID ────────────────────────────────────────────────────
  if (temDupUID) {
    builder.addSeparatorComponents(sep());
    const dupLines = dupUIDs.map(d => {
      const dt = d.receivedAt ? new Date(d.receivedAt).toLocaleDateString('pt-BR') : '—';
      return (
        `🔁 **UID \`${d.uid}\`** já consta em outra inscrição\n` +
        `> 🏟️ Squad: **${d.squadName}** · Manager: ${d.managerName}\n` +
        `> 📅 Recebida em: ${dt} · ID: \`${d.submissionId}\``
      );
    });
    builder
      .addTextDisplayComponents(txt('### 🔁 UIDs Duplicados'))
      .addTextDisplayComponents(txt(dupLines.join('\n\n')));
  }

  // ── Duplicata de ficha/squad ─────────────────────────────────────────────
  if (temDupSquad) {
    builder.addSeparatorComponents(sep());
    const squadLines = dupSquad.map(d => {
      const dt = d.receivedAt ? new Date(d.receivedAt).toLocaleDateString('pt-BR') : '—';
      return (
        `📋 **${d.squadName}** já enviou uma ficha\n` +
        `> 👤 Manager: ${d.managerName} · 📅 ${dt}\n` +
        `> 🆔 \`${d.submissionId}\``
      );
    });
    builder
      .addTextDisplayComponents(txt('### 📋 Ficha Duplicada'))
      .addTextDisplayComponents(txt(squadLines.join('\n\n')));
  }

  // ── Aviso de ação ────────────────────────────────────────────────────────
  if (temProblema) {
    builder.addSeparatorComponents(sep());
    const avisos = [];
    if (temBanido)   avisos.push('⛔ UID banido — não permitir participação');
    if (temDupUID)   avisos.push('🔁 UID duplicado — verificar se é reinscrição ou fraude');
    if (temDupSquad) avisos.push('📋 Ficha duplicada — verificar se é re-envio ou squad diferente');
    builder.addTextDisplayComponents(txt(
      '**⚠️ Ação necessária:**\n' + avisos.map(a => `• ${a}`).join('\n')
    ));
  }

  builder
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt('-# 🌐 Oblivion League · Integração Tally Automática'));

  return builder;
}

// ─── Handler principal ────────────────────────────────────────────────────────

async function handleTallyWebhook(req, res, client) {
  try {
    const body = req.body;

    if (body?.eventType && body.eventType !== 'FORM_RESPONSE') {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const parsed = parseTallyPayload(body);
    console.log(`[TALLY] "${parsed.formName}" | Squad: ${parsed.squadName ?? '?'} | UIDs: ${parsed.uids.length} | ID: ${parsed.submissionId}`);

    // Salvar no banco ANTES das verificações (para que o ID da atual não conflite)
    await tallyDB.saveSubmission({
      submissionId: parsed.submissionId,
      formName:     parsed.formName,
      squadName:    parsed.squadName,
      squadTag:     parsed.squadTag,
      managerName:  parsed.managerName,
      uids:         parsed.uids.map(u => u.uid),
      rawExtras:    parsed.extras,
    });

    // Verificar bans + duplicatas em paralelo
    const { banChecks, dupUIDs, dupSquad } = await verificarTudo(parsed);

    // Logs de problemas detectados
    const banidos = banChecks.filter(c => c.status === 'BANIDO');
    if (banidos.length > 0)  console.warn(`[TALLY] ⛔ Banidos: ${banidos.map(b => b.uid).join(', ')}`);
    if (dupUIDs.length > 0)  console.warn(`[TALLY] 🔁 UIDs dup: ${dupUIDs.map(d => d.uid).join(', ')}`);
    if (dupSquad.length > 0) console.warn(`[TALLY] 📋 Squad dup: ${dupSquad.map(d => d.squadName).join(', ')}`);

    // Enviar para o canal
    const channel = findTallyChannel(client);
    if (!channel) {
      console.warn('[TALLY] Canal inscricoes-tally não encontrado.');
      return res.status(200).json({ ok: true, warn: 'canal_nao_encontrado' });
    }

    const container = buildTallyContainer(parsed, banChecks, dupUIDs, dupSquad);
    await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });

    res.status(200).json({
      ok:      true,
      uids:    banChecks.length,
      banidos: banidos.length,
      dupUIDs: dupUIDs.length,
      dupSquad:dupSquad.length,
    });
  } catch (err) {
    console.error('[TALLY] Erro:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = { handleTallyWebhook };
