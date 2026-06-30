const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { search, setNote } = require('../utils/movieDB');
const { refreshPanel } = require('../utils/refreshPanel');

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
        .setDescription('Nota de 0 a 10, ex: 6.8')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(10)
    ),

  async autocomplete(interaction) {
    const query = interaction.options.getFocused();
    const results = await search(query || '');
    await interaction.respond(results.map(m => ({ name: m.name, value: m.name })));
  },

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const name = interaction.options.getString('filme');
    const nota = interaction.options.getNumber('nota');

    if (nota === null || isNaN(nota) || nota < 0 || nota > 10) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFF4444)
            .addTextDisplayComponents(txt(`### ❌ Nota inválida\nDigite um número entre **0** e **10**, ex: \`6.8\` ou \`6,8\`.`)),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

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

    refreshPanel(interaction.guildId).catch(() => {});
  },
};
