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

function buildFilmesContainer(movies, filter) {
  const all     = movies;
  const watched = movies.filter(m => m.watched);
  const pending = movies.filter(m => !m.watched);
  const percent = all.length > 0 ? Math.round((watched.length / all.length) * 100) : 0;

  const list = filter === 'watched' ? watched
             : filter === 'pending' ? pending
             : all;

  const accent = filter === 'watched' ? 0x57F287
               : filter === 'pending' ? 0x6C5CE7
               : 0x6C5CE7;

  const header = filter === 'watched'
    ? `### ✅  Assistidos  —  ${watched.length} de ${all.length}`
    : filter === 'pending'
    ? `### 🎞️  Pendentes  —  ${pending.length} de ${all.length}`
    : `### ✨  Premiere  🌙`;

  const subtitle = filter === 'all'
    ? `-# **${watched.length}** assistidos  ·  **${pending.length}** pendentes  ·  \`${'▓'.repeat(Math.round(percent / 100 * 10))}${'░'.repeat(10 - Math.round(percent / 100 * 10))}\`  **${percent}%**`
    : null;

  const container = new ContainerBuilder().setAccentColor(accent);
  container.addTextDisplayComponents(txt(subtitle ? `${header}\n${subtitle}` : header));
  container.addSeparatorComponents(sep());

  if (list.length === 0) {
    container.addTextDisplayComponents(txt(`*Nenhum filme nessa categoria ainda.*`));
  } else {
    const chunks = [];
    for (let i = 0; i < list.length; i += 10) chunks.push(list.slice(i, i + 10));

    for (let ci = 0; ci < chunks.length; ci++) {
      const lines = chunks[ci].map(formatMovie).join('\n');
      container.addTextDisplayComponents(txt(lines));
      if (ci < chunks.length - 1) container.addSeparatorComponents(sep());
    }
  }

  container.addSeparatorComponents(sep());

  const row = new ActionRowBuilder().addComponents(
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
      .setStyle(filter === 'pending' ? ButtonStyle.Primary : ButtonStyle.Secondary),
  );
  container.addActionRowComponents(row);

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
