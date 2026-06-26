const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { getAll } = require('../utils/movieDB');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filmes')
    .setDescription('Lista todos os filmes da watchlist'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const movies = await getAll();
    const watched = movies.filter(m => m.watched).length;

    const chunks = [];
    for (let i = 0; i < movies.length; i += 10) {
      chunks.push(movies.slice(i, i + 10));
    }

    const container = new ContainerBuilder().setAccentColor(0x5865F2);

    container.addTextDisplayComponents(txt(`### 🎬 Watchlist — ${watched}/${movies.length} assistidos`));
    container.addSeparatorComponents(sep());

    for (let ci = 0; ci < chunks.length; ci++) {
      const lines = chunks[ci].map(m => {
        const icon = m.watched ? '☑' : '☐';
        const note = m.note !== null ? ` ⭐${parseFloat(m.note)}` : '';
        return `${icon} ${m.name}${note}`;
      }).join('\n');
      container.addTextDisplayComponents(txt(lines));
      if (ci < chunks.length - 1) container.addSeparatorComponents(sep());
    }

    container.addSeparatorComponents(sep());
    container.addTextDisplayComponents(txt(`-# Use /info <filme> para ver detalhes`));

    await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
