const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { search, removeMovie } = require('../utils/movieDB');
const { refreshPanel }        = require('../utils/refreshPanel');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remover')
    .setDescription('🗑️ Remove um filme da watchlist do Premiere')
    .addStringOption(o =>
      o.setName('filme').setDescription('Nome do filme (autocomplete)').setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const results = await search(interaction.options.getFocused() || '');
    await interaction.respond(results.map(m => ({ name: m.name, value: m.name })));
  },

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const name  = interaction.options.getString('filme');
    const movie = await removeMovie(name);

    if (!movie) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xE74C3C)
            .addTextDisplayComponents(txt(
              `**${name}**\n` +
              `-# não encontrado  ·  use /filmes para ver a lista`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const statusStr = movie.watched ? 'assistido' : 'na fila';
    const noteStr   = movie.note !== null ? `  ·  ${parseFloat(movie.note).toFixed(1)}` : '';

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xE74C3C)
          .addTextDisplayComponents(txt(
            `**${movie.name}**\n` +
            `-# removido  ·  estava ${statusStr}${noteStr}`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    refreshPanel(interaction.guildId).catch(e => console.error('[refreshPanel]', e));
  },
};
