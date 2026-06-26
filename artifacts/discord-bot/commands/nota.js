const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { search, setNote } = require('../utils/movieDB');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nota')
    .setDescription('Adiciona ou altera a nota de um filme (0–10)')
    .addStringOption(o =>
      o.setName('filme')
        .setDescription('Nome do filme')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addNumberOption(o =>
      o.setName('nota')
        .setDescription('Nota de 0 a 10 (aceita decimais)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(10)
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

    const name = interaction.options.getString('filme');
    const nota = interaction.options.getNumber('nota');

    const movie = await setNote(name, nota);

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
          .setAccentColor(0xFEE75C)
          .addTextDisplayComponents(txt(`### ⭐ Nota registrada`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `🎬 **${movie.name}**\n` +
            `⭐ **${parseFloat(movie.note)}/10**`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
