const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { search, removeMovie } = require('../utils/movieDB');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remover')
    .setDescription('Remove um filme da watchlist')
    .addStringOption(o =>
      o.setName('filme')
        .setDescription('Nome do filme')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const query = interaction.options.getFocused();
    const results = await search(query || '');
    await interaction.respond(
      results.map(m => ({ name: m.name, value: m.name }))
    );
  },

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const name  = interaction.options.getString('filme');
    const movie = await removeMovie(name);

    if (!movie) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFF4444)
            .addTextDisplayComponents(txt(`### ❌ Filme não encontrado\n\`${name}\``)),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xED4245)
          .addTextDisplayComponents(txt(`### 🗑️ Filme removido`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(`🎬 **${movie.name}**`)),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
