const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

function sep()  { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function gap()  { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

function progressBar(percent, length = 12) {
  const filled = Math.round((percent / 100) * length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
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

  const container = new ContainerBuilder().setAccentColor(0x5865F2);

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  container.addTextDisplayComponents(txt(`### 🎬 Movie Tracker`));
  container.addSeparatorComponents(sep());

  // ── Stats ──────────────────────────────────────────────────────────────────
  const bar       = progressBar(percent);
  const avgStr    = avgNote ? `  ·  ⭐ **${avgNote}** média` : '';
  const statsText =
    `**Assistidos:** ${watched.length}/${total}  ·  **${percent}%**\n` +
    `\`${bar}\`${avgStr}`;

  container.addTextDisplayComponents(txt(statsText));
  container.addSeparatorComponents(sep());

  // ── Botões de filtro ────────────────────────────────────────────────────────
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('painel:all')
      .setLabel('🎬 Todos')
      .setStyle(filter === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('painel:watched')
      .setLabel('✅ Assistidos')
      .setStyle(filter === 'watched' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('painel:pending')
      .setLabel('🔲 Pendentes')
      .setStyle(filter === 'pending' ? ButtonStyle.Primary : ButtonStyle.Secondary),
  );
  container.addActionRowComponents(row);
  container.addSeparatorComponents(sep());

  // ── Lista de filmes ─────────────────────────────────────────────────────────
  if (list.length === 0) {
    container.addTextDisplayComponents(txt(`*Nenhum filme nessa categoria ainda.*`));
  } else {
    const chunks = [];
    for (let i = 0; i < list.length; i += 10) chunks.push(list.slice(i, i + 10));

    for (let ci = 0; ci < chunks.length; ci++) {
      const lines = chunks[ci].map(m => {
        const icon = m.watched ? '☑' : '☐';
        const note = m.note !== null ? ` ⭐${parseFloat(m.note)}` : '';
        return `${icon} ${m.name}${note}`;
      }).join('\n');
      container.addTextDisplayComponents(txt(lines));
      if (ci < chunks.length - 1) container.addSeparatorComponents(sep());
    }
  }

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  container.addSeparatorComponents(sep());
  container.addTextDisplayComponents(txt(
    `-# Atualizado automaticamente · use /assistido /nota /adicionar nos bastidores`
  ));

  return container;
}

module.exports = { buildPanelContainer };
