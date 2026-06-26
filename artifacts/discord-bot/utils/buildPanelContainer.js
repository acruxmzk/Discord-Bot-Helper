const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

function sep()    { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function sepLg()  { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false); }
function txt(c)   { return new TextDisplayBuilder().setContent(c); }

function progressBar(percent, length = 16) {
  const filled = Math.round((percent / 100) * length);
  return '▓'.repeat(filled) + '░'.repeat(length - filled);
}

function formatMovie(m) {
  const note = m.note !== null ? `  ⭐ **${parseFloat(m.note)}**` : '';
  return m.watched
    ? `✅  **${m.name}**${note}`
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

  // Accent muda conforme filtro ativo
  const accent = filter === 'watched' ? 0x57F287
               : filter === 'pending' ? 0x6C5CE7
               : 0x6C5CE7;

  const container = new ContainerBuilder().setAccentColor(accent);

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  container.addTextDisplayComponents(txt(
    `### ✨  Premiere  🌙\n` +
    `-# Sua sala de cinema particular`
  ));
  container.addSeparatorComponents(sep());

  // ── Stats ──────────────────────────────────────────────────────────────────
  const bar    = progressBar(percent);
  const avgStr = avgNote
    ? `⭐  Nota média  **${avgNote}** / 10  ·  -# ${rated.length} avaliado${rated.length !== 1 ? 's' : ''}`
    : `⭐  Nenhum filme avaliado ainda`;

  container.addTextDisplayComponents(txt(
    `🎞️  **${watched.length}** assistidos  ·  **${pending.length}** na fila  ·  **${total}** total\n` +
    `\`${bar}\`  **${percent}%**\n` +
    avgStr
  ));
  container.addSeparatorComponents(sep());

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
      .setStyle(filter === 'pending' ? ButtonStyle.Primary : ButtonStyle.Secondary),
  );
  container.addActionRowComponents(row);
  container.addSeparatorComponents(sep());

  // ── Lista ──────────────────────────────────────────────────────────────────
  if (list.length === 0) {
    container.addSeparatorComponents(sepLg());
    container.addTextDisplayComponents(txt(`*Nenhum filme nessa categoria ainda.*`));
    container.addSeparatorComponents(sepLg());
  } else {
    const chunks = [];
    for (let i = 0; i < list.length; i += 10) chunks.push(list.slice(i, i + 10));

    for (let ci = 0; ci < chunks.length; ci++) {
      const lines = chunks[ci].map(formatMovie).join('\n');
      container.addTextDisplayComponents(txt(lines));
      if (ci < chunks.length - 1) container.addSeparatorComponents(sep());
    }
  }

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  container.addSeparatorComponents(sep());
  container.addTextDisplayComponents(txt(
    `-# 🌙  Premiere  ·  Atualiza em tempo real com  /assistido  /nota  /adicionar`
  ));

  return container;
}

module.exports = { buildPanelContainer };
