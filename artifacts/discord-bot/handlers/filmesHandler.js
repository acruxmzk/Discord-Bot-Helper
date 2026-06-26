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

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

function buildFilmesContainer(movies, filter) {
  const all     = movies;
  const watched = movies.filter(m => m.watched);
  const pending = movies.filter(m => !m.watched);

  const list = filter === 'watched' ? watched
             : filter === 'pending' ? pending
             : all;

  const label = filter === 'watched' ? `☑ Assistidos — ${watched.length}/${all.length}`
              : filter === 'pending' ? `☐ Pendentes — ${pending.length}/${all.length}`
              : `🎬 Watchlist — ${watched.length}/${all.length} assistidos`;

  const container = new ContainerBuilder().setAccentColor(0x5865F2);
  container.addTextDisplayComponents(txt(`### ${label}`));
  container.addSeparatorComponents(sep());

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

  container.addSeparatorComponents(sep());

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('filmes:all')
      .setLabel('🎬 Todos')
      .setStyle(filter === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('filmes:watched')
      .setLabel('✅ Assistidos')
      .setStyle(filter === 'watched' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('filmes:pending')
      .setLabel('🔲 Pendentes')
      .setStyle(filter === 'pending' ? ButtonStyle.Primary : ButtonStyle.Secondary),
  );
  container.addActionRowComponents(row);

  return container;
}

async function handleFilmesButton(interaction) {
  const filter = interaction.customId.split(':')[1] ?? 'all';
  const movies = await getAll();
  const container = buildFilmesContainer(movies, filter);
  await interaction.update({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });
}

async function handlePainelButton(interaction) {
  const filter = interaction.customId.split(':')[1] ?? 'all';
  const movies = await getAll();
  const container = buildPanelContainer(movies, filter);
  await interaction.update({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });
}

module.exports = { handleFilmesButton, handlePainelButton, buildFilmesContainer };
