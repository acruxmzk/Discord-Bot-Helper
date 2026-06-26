const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const { getAll } = require('../utils/movieDB');
const { buildPanelContainer } = require('../utils/buildPanelContainer');

function sep()  { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

function progressBar(percent, length = 14) {
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

function buildFilmesContainer(movies, filter) {
  const all     = movies;
  const watched = movies.filter(m => m.watched);
  const pending = movies.filter(m => !m.watched);
  const percent = all.length > 0 ? Math.round((watched.length / all.length) * 100) : 0;
  const rated   = watched.filter(m => m.note !== null);
  const avgNote = rated.length > 0
    ? (rated.reduce((s, m) => s + parseFloat(m.note), 0) / rated.length).toFixed(1)
    : null;

  const list = filter === 'watched' ? watched
             : filter === 'pending' ? pending
             : all;

  const accent = filter === 'watched' ? 0x57F287
               : filter === 'pending' ? 0xFEE75C
               : 0x6C5CE7;

  let header = '';
  let subtitle = '';

  if (filter === 'all') {
    const bar = progressBar(percent);
    header   = `### ✨  Premiere  🌙`;
    subtitle = `-# **${watched.length}** assistidos  ·  **${pending.length}** pendentes  ·  \`${bar}\`  **${percent}%**` +
               (avgNote ? `  ·  ⭐ **${avgNote}**` : '');
  } else if (filter === 'watched') {
    header   = `### ✅  Assistidos  —  ${watched.length} de ${all.length}`;
    subtitle = avgNote
      ? `-# Nota média  **${avgNote}** / 10  ·  ${rated.length} avaliado${rated.length !== 1 ? 's' : ''}`
      : `-# Nenhum avaliado ainda`;
  } else {
    header   = `### 🎞️  Pendentes  —  ${pending.length} de ${all.length}`;
    subtitle = `-# ${pending.length} filme${pending.length !== 1 ? 's' : ''} esperando na fila`;
  }

  const container = new ContainerBuilder().setAccentColor(accent);
  container.addTextDisplayComponents(txt(`${header}\n${subtitle}`));
  container.addSeparatorComponents(sep());

  if (list.length === 0) {
    container.addTextDisplayComponents(txt(`-# Nenhum filme nessa categoria ainda.`));
  } else {
    const chunks = [];
    for (let i = 0; i < list.length; i += 10) chunks.push(list.slice(i, i + 10));

    for (let ci = 0; ci < chunks.length; ci++) {
      container.addTextDisplayComponents(txt(chunks[ci].map(formatMovie).join('\n')));
      if (ci < chunks.length - 1) container.addSeparatorComponents(sep());
    }
  }

  container.addSeparatorComponents(sep());

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('filmes:all')
        .setLabel(`Todos  (${all.length})`)
        .setStyle(filter === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('filmes:watched')
        .setLabel(`✅  Assistidos  (${watched.length})`)
        .setStyle(filter === 'watched' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('filmes:pending')
        .setLabel(`🎞️  Pendentes  (${pending.length})`)
        .setStyle(filter === 'pending' ? ButtonStyle.Secondary : ButtonStyle.Secondary),
    )
  );

  return container;
}

async function handleFilmesButton(interaction) {
  const filter    = interaction.customId.split(':')[1] ?? 'all';
  const movies    = await getAll();
  const container = buildFilmesContainer(movies, filter);
  await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

async function handlePainelButton(interaction) {
  const filter    = interaction.customId.split(':')[1] ?? 'all';
  const movies    = await getAll();
  const container = buildPanelContainer(movies, filter);
  await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

module.exports = { handleFilmesButton, handlePainelButton, buildFilmesContainer };
