const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

function sep()   { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function sepLg() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false); }
function txt(c)  { return new TextDisplayBuilder().setContent(c); }

function progressBar(percent, length = 18) {
  const filled = Math.round((percent / 100) * length);
  return '▓'.repeat(filled) + '░'.repeat(length - filled);
}

function fmtDate(raw) {
  if (!raw) return '';
  const d  = new Date(raw);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

function formatMovie(m) {
  const note = m.note !== null ? `  ⭐ **${parseFloat(m.note)}**` : '';
  const date = m.watched && m.watched_at ? `  ·  ${fmtDate(m.watched_at)}` : '';
  return m.watched
    ? `✅  **${m.name}**${note}${date}`
    : `○  ${m.name}`;
}

function buildPanelContainer(movies, filter = 'all') {
  const total   = movies.length;
  const watched = movies.filter(m => m.watched);
  const pending = movies.filter(m => !m.watched);
  const percent = total > 0 ? Math.round((watched.length / total) * 100) : 0;
  const rated   = movies.filter(m => m.note !== null);
  const avgNote = rated.length > 0
    ? (rated.reduce((s, m) => s + parseFloat(m.note), 0) / rated.length).toFixed(1)
    : null;

  const list = filter === 'watched' ? watched
             : filter === 'pending' ? pending
             : movies;

  const accent = filter === 'watched' ? 0x57F287
               : filter === 'pending' ? 0xFEE75C
               : 0x6C5CE7;

  const container = new ContainerBuilder().setAccentColor(accent);

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  container.addTextDisplayComponents(txt(
    `### ✨  Premiere  🌙\n` +
    `-# Sua sala de cinema particular`
  ));
  container.addSeparatorComponents(sep());

  // ── Progresso ──────────────────────────────────────────────────────────────
  const bar = progressBar(percent);
  container.addTextDisplayComponents(txt(
    `📊  **Progresso**  ·  **${watched.length}** de **${total}**  —  **${percent}%** concluído\n` +
    `\`${bar}\``
  ));
  container.addSeparatorComponents(sep());

  // ── Avaliações ─────────────────────────────────────────────────────────────
  if (avgNote) {
    container.addTextDisplayComponents(txt(
      `⭐  **Nota média  ${avgNote} / 10**\n` +
      `-# Baseado em ${rated.length} avaliação${rated.length !== 1 ? 'ções' : ''}`
    ));
  } else {
    container.addTextDisplayComponents(txt(
      `⭐  **Avaliações**\n` +
      `-# Nenhum filme avaliado ainda  ·  use /nota para avaliar`
    ));
  }
  container.addSeparatorComponents(sep());

  // ── Recentes ───────────────────────────────────────────────────────────────
  const recent = watched
    .slice()
    .sort((a, b) => {
      if (a.watched_at && b.watched_at) return new Date(b.watched_at) - new Date(a.watched_at);
      if (a.watched_at) return -1;
      if (b.watched_at) return 1;
      return b.id - a.id;
    })
    .slice(0, 3);

  if (recent.length > 0) {
    const recentLines = recent.map(m => {
      const note = m.note !== null ? `  ⭐ **${parseFloat(m.note)}**` : '';
      const date = m.watched_at ? `  ·  -# ${fmtDate(m.watched_at)}` : '';
      return `✅  **${m.name}**${note}${date}`;
    }).join('\n');
    container.addTextDisplayComponents(txt(`🕐  **Recentes**\n${recentLines}`));
    container.addSeparatorComponents(sep());
  }

  // ── Filtros ─────────────────────────────────────────────────────────────────
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('painel:all')
      .setLabel(`Todos  (${total})`)
      .setStyle(filter === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('painel:watched')
      .setLabel(`✅  Assistidos  (${watched.length})`)
      .setStyle(filter === 'watched' ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('painel:pending')
      .setLabel(`🎞️  Pendentes  (${pending.length})`)
      .setStyle(filter === 'pending' ? ButtonStyle.Secondary : ButtonStyle.Secondary)
      .setDisabled(false),
  );
  container.addActionRowComponents(row);
  container.addSeparatorComponents(sep());

  // ── Lista ──────────────────────────────────────────────────────────────────
  if (list.length === 0) {
    container.addSeparatorComponents(sepLg());
    container.addTextDisplayComponents(txt(`-# Nenhum filme nessa categoria ainda.`));
    container.addSeparatorComponents(sepLg());
  } else {
    const chunks = [];
    for (let i = 0; i < list.length; i += 10) chunks.push(list.slice(i, i + 10));

    for (let ci = 0; ci < chunks.length; ci++) {
      container.addTextDisplayComponents(txt(chunks[ci].map(formatMovie).join('\n')));
      if (ci < chunks.length - 1) container.addSeparatorComponents(sep());
    }
  }

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  container.addSeparatorComponents(sep());
  container.addTextDisplayComponents(txt(
    `-# 🌙  Premiere  ·  /assistido  ·  /nota  ·  /adicionar  ·  /remover`
  ));

  return container;
}

module.exports = { buildPanelContainer };
