const {
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ChannelType,
} = require('discord.js');
const banDB   = require('../utils/banDB');
const tallyDB = require('../utils/tallyDB');

// ─── Builders ─────────────────────────────────────────────────────────────────

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = (s) => new TextDisplayBuilder().setContent(s);

// ─── Localizar canais ─────────────────────────────────────────────────────────

const TALLY_CHANNEL_PATTERNS = [
  'inscricoes-tally', 'inscricoes_tally', 'inscricao-tally', 'inscricao_tally',
  'inscricoes tally', 'tally', 'inscricoes',
];

const LOG_CHANNEL_PATTERNS = [
  'staff-logs', 'staff-log', 'logs-bot', 'bot-logs', 'bot-log',
  'admin-logs', 'logs', 'sistema', 'notificacoes',
];

function normCh(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

function findChannel(client, patterns) {
  for (const guild of client.guilds.cache.values()) {
    for (const channel of guild.channels.cache.values()) {
      if (channel.type !== ChannelType.GuildText) continue;
      const name = normCh(channel.name ?? '');
      if (patterns.some(p => name.includes(normCh(p)))) return channel;
    }
  }
  return null;
}

// ─── Parsing do payload Tally ─────────────────────────────────────────────────

const UID_REGEX = /^\d{6,25}$/;

const SQUAD_FIELD = {
  name:    ['cla', 'clan', 'squad', 'equipe', 'time', 'nome do time', 'nome da equipe', 'nome do squad'],
  tag:     ['tag', 'sigla'],
  manager: ['manager', 'capita', 'lider', 'responsavel', 'nome da manager', 'nome da capitã'],
  nick:    ['nick', 'nome do jogador', 'apelido', 'jogador'],
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
    nicks:  [],   // { label, nick }
    extras: [],   // { label, value }
  };

  for (const field of fields) {
    const label = (field.label ?? '').trim();
    const type  = field.type ?? '';
    const raw   = field.value;

    if (!raw || type === 'FORM_TITLE' || type === 'HIDDEN_FIELDS') continue;

    const value = Array.isArray(raw) ? raw.join(', ') : String(raw).trim();
    if (!value || value === 'undefined') continue;

    const labelLow = label.toLowerCase();

    // UID: label contém "uid" / "id do jogador" OU valor é só números longos
    if (labelLow.includes('uid') || labelLow.includes('id do jogador') || UID_REGEX.test(value)) {
      result.uids.push({ label, uid: value.replace(/\s/g, '') });
      continue;
    }

    const kind = classifyExtra(label);
    if (kind === 'name'    && !result.squadName)   result.squadName   = value;
    if (kind === 'tag'     && !result.squadTag)    result.squadTag    = value;
    if (kind === 'manager' && !result.managerName) result.managerName = value;
    if (kind === 'nick')   result.nicks.push({ label, nick: value });

    result.extras.push({ label, value });
  }

  return result;
}

// ─── Verificações ─────────────────────────────────────────────────────────────

async function verificarTudo(parsed) {
  const uidList = parsed.uids.map(u => u.uid);

  const [banChecksByUID, banChecksByNick, dupUIDs, dupSquad] = await Promise.all([
    // 1. Ban por UID
    Promise.all(parsed.uids.map(async ({ label, uid }) => {
      try {
        const check = await banDB.checkPlayer(uid);
        return { label, uid, ...check };
      } catch {
        return { label, uid, status: 'ERRO' };
      }
    })),
    // 2. Ban por nick
    Promise.all(parsed.nicks.map(async ({ label, nick }) => {
      try {
        const found = await banDB.checkPlayerByNick(nick);
        if (!found) return null;
        return { label, nick, uid: found.uid, reason: found.reason, bannedBy: found.bannedBy, bannedAt: found.bannedAt, status: 'BANIDO' };
      } catch {
        return null;
      }
    })),
    // 3. UIDs duplicados
    tallyDB.findDuplicateUIDs(uidList, parsed.submissionId),
    // 4. Squad duplicado
    tallyDB.findDuplicateSquad(parsed.squadName, parsed.submissionId),
  ]);

  const nickBans = banChecksByNick.filter(Boolean);

  return { banChecks: banChecksByUID, nickBans, dupUIDs, dupSquad };
}

// ─── Montar container Discord ─────────────────────────────────────────────────

function buildTallyContainer(parsed, banChecks, nickBans, dupUIDs, dupSquad) {
  const temBanidoUID  = banChecks.some(c => c.status === 'BANIDO');
  const temBanidoNick = nickBans.length > 0;
  const temBanido     = temBanidoUID || temBanidoNick;
  const temDupUID     = dupUIDs.length > 0;
  const temDupSquad   = dupSquad.length > 0;
  const temProblema   = temBanido || temDupUID || temDupSquad;

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

  // ── Dados do squad ────────────────────────────────────────────────────────
  const squadInfo = [];
  if (parsed.squadName)   squadInfo.push(`🏟️ **Squad:** ${parsed.squadName}`);
  if (parsed.squadTag)    squadInfo.push(`🏷️ **Tag:** ${parsed.squadTag}`);
  if (parsed.managerName) squadInfo.push(`👤 **Manager:** ${parsed.managerName}`);

  const otherExtras = parsed.extras.filter(e => classifyExtra(e.label) === 'other');

  if (squadInfo.length > 0 || otherExtras.length > 0) {
    builder.addSeparatorComponents(sep());
    builder.addTextDisplayComponents(txt(
      [...squadInfo, ...otherExtras.slice(0, 6).map(e => `**${e.label}:** ${e.value}`)].join('\n')
    ));
  }

  // ── Resultado por UID ─────────────────────────────────────────────────────
  builder.addSeparatorComponents(sep());

  const uidLines = banChecks.map(c => {
    const isDup = dupUIDs.some(d => d.uid === c.uid);
    const dupTag = isDup ? ' 🔁 **DUP**' : '';

    if (c.status === 'BANIDO') {
      const dt = c.bannedAt ? new Date(c.bannedAt).toLocaleDateString('pt-BR') : '—';
      return (
        `🔴 **UID \`${c.uid}\`** — ${c.label}${dupTag}\n` +
        `> ⛔ **BANIDO** · Motivo: ${c.reason}\n` +
        `> 📅 ${dt} · Por: ${c.bannedBy}`
      );
    }
    if (c.status === 'ERRO') return `⚠️ **UID \`${c.uid}\`** — ${c.label}${dupTag}\n> Erro ao verificar`;
    return `🟢 **UID \`${c.uid}\`** — ${c.label}${dupTag} · Limpo`;
  });

  builder.addTextDisplayComponents(txt(
    uidLines.join('\n\n') || '_(nenhum UID encontrado no formulário)_'
  ));

  // ── Banidos por nick ──────────────────────────────────────────────────────
  if (temBanidoNick) {
    builder.addSeparatorComponents(sep());
    const nickLines = nickBans.map(b => {
      const dt = b.bannedAt ? new Date(b.bannedAt).toLocaleDateString('pt-BR') : '—';
      return (
        `🔴 **Nick "${b.nick}"** (campo: ${b.label})\n` +
        `> ⛔ **BANIDO** · UID: \`${b.uid}\`\n` +
        `> Motivo: ${b.reason} · 📅 ${dt}`
      );
    });
    builder
      .addTextDisplayComponents(txt('### 🚨 Banidos por Nick'))
      .addTextDisplayComponents(txt(nickLines.join('\n\n')));
  }

  // ── UIDs duplicados ───────────────────────────────────────────────────────
  if (temDupUID) {
    builder.addSeparatorComponents(sep());
    const dupLines = dupUIDs.map(d => {
      const dt = d.receivedAt ? new Date(d.receivedAt).toLocaleDateString('pt-BR') : '—';
      return (
        `🔁 **UID \`${d.uid}\`** já consta em outra inscrição\n` +
        `> 🏟️ Squad: **${d.squadName}** · Manager: ${d.managerName}\n` +
        `> 📅 ${dt} · ID: \`${d.submissionId}\``
      );
    });
    builder
      .addTextDisplayComponents(txt('### 🔁 UIDs Duplicados'))
      .addTextDisplayComponents(txt(dupLines.join('\n\n')));
  }

  // ── Squad duplicado ───────────────────────────────────────────────────────
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

  // ── Ação necessária ───────────────────────────────────────────────────────
  if (temProblema) {
    builder.addSeparatorComponents(sep());
    const avisos = [];
    if (temBanido)    avisos.push('⛔ UID/nick banido — inscrição **REJEITADA automaticamente**');
    if (temDupUID)    avisos.push('🔁 UID duplicado — verificar reinscrição ou fraude');
    if (temDupSquad)  avisos.push('📋 Ficha duplicada — verificar re-envio ou squad diferente');
    builder.addTextDisplayComponents(txt(
      '**⚠️ Ação necessária:**\n' + avisos.map(a => `• ${a}`).join('\n')
    ));
  }

  builder
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt('-# 🌐 Oblivion League · Integração Tally Automática'));

  return builder;
}

// ─── Alerta de ban no canal de staff ─────────────────────────────────────────

async function alertarStaff(client, parsed, banChecks, nickBans) {
  const logChannel = findChannel(client, LOG_CHANNEL_PATTERNS);
  if (!logChannel) return;

  // Encontrar role @staff
  const guild     = logChannel.guild;
  const staffRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'staff');
  const mention   = staffRole ? `<@&${staffRole.id}>` : '**@STAFF**';

  const todos = [
    ...banChecks.filter(c => c.status === 'BANIDO').map(c => `\`${c.uid}\` (${c.label})`),
    ...nickBans.map(b => `"${b.nick}" → \`${b.uid}\``),
  ];

  const alerta = new ContainerBuilder()
    .setAccentColor(0xFF0000)
    .addTextDisplayComponents(txt(
      `### 🚨 JOGADOR BANIDO TENTOU SE INSCREVER\n` +
      `**Squad:** ${parsed.squadName ?? '—'}  ·  **Manager:** ${parsed.managerName ?? '—'}\n` +
      `**UIDs/Nicks bloqueados:** ${todos.join(', ')}\n` +
      `**Inscrição:** REJEITADA automaticamente\n` +
      `-# ID: \`${parsed.submissionId}\``
    ));

  await logChannel.send({
    content: mention,
    components: [alerta],
    flags: MessageFlags.IsComponentsV2,
  }).catch(() => {});
}

// ─── Handler principal ────────────────────────────────────────────────────────

async function handleTallyWebhook(req, res, client) {
  try {
    const body = req.body;

    if (body?.eventType && body.eventType !== 'FORM_RESPONSE') {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const parsed = parseTallyPayload(body);
    console.log(`[TALLY] "${parsed.formName}" | Squad: ${parsed.squadName ?? '?'} | UIDs: ${parsed.uids.length} | Nicks: ${parsed.nicks.length} | ID: ${parsed.submissionId}`);

    // Salvar no banco ANTES das verificações
    await tallyDB.saveSubmission({
      submissionId: parsed.submissionId,
      formName:     parsed.formName,
      squadName:    parsed.squadName,
      squadTag:     parsed.squadTag,
      managerName:  parsed.managerName,
      uids:         parsed.uids.map(u => u.uid),
      rawExtras:    parsed.extras,
    });

    // Verificar bans (UID + nick) + duplicatas em paralelo
    const { banChecks, nickBans, dupUIDs, dupSquad } = await verificarTudo(parsed);

    const temBanido = banChecks.some(c => c.status === 'BANIDO') || nickBans.length > 0;

    // Auto-rejeitar e alertar staff se houver banido
    if (temBanido) {
      await tallyDB.flagAsRejected(parsed.submissionId);
      console.warn(`[TALLY] ⛔ REJEITADA — banidos: ${[
        ...banChecks.filter(c => c.status === 'BANIDO').map(b => b.uid),
        ...nickBans.map(b => b.nick),
      ].join(', ')}`);
      await alertarStaff(client, parsed, banChecks, nickBans);
    }

    if (dupUIDs.length > 0)  console.warn(`[TALLY] 🔁 UIDs dup: ${dupUIDs.map(d => d.uid).join(', ')}`);
    if (dupSquad.length > 0) console.warn(`[TALLY] 📋 Squad dup: ${dupSquad.map(d => d.squadName).join(', ')}`);

    // Enviar resumo no canal Tally
    const tallyChannel = findChannel(client, TALLY_CHANNEL_PATTERNS);
    if (!tallyChannel) {
      console.warn('[TALLY] Canal inscricoes-tally não encontrado.');
      return res.status(200).json({ ok: true, warn: 'canal_nao_encontrado' });
    }

    const container = buildTallyContainer(parsed, banChecks, nickBans, dupUIDs, dupSquad);
    await tallyChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });

    res.status(200).json({
      ok:        true,
      uids:      banChecks.length,
      banidos:   banChecks.filter(c => c.status === 'BANIDO').length + nickBans.length,
      rejeitada: temBanido,
      dupUIDs:   dupUIDs.length,
      dupSquad:  dupSquad.length,
    });
  } catch (err) {
    console.error('[TALLY] Erro:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = { handleTallyWebhook };
