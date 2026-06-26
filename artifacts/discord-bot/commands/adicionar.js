const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { addMovie } = require('../utils/movieDB');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adicionar')
    .setDescription('Adiciona um novo filme à watchlist')
    .addStringOption(o =>
      o.setName('filme')
        .setDescription('Nome do filme')
        .setRequired(true)
        .setMaxLength(200)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const name  = interaction.options.getString('filme').trim();
    const movie = await addMovie(name);

    if (!movie) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFF4444)
            .addTextDisplayComponents(txt(
              `### ⚠️ Filme já existe\n` +
              `\`${name}\` já está na watchlist.`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x57F287)
          .addTextDisplayComponents(txt(`### ➕ Filme adicionado com sucesso`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(`🎬 **${movie.name}**`)),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
