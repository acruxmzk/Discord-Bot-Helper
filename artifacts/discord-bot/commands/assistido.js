const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { search, markWatched } = require('../utils/movieDB');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assistido')
    .setDescription('Marca um filme como assistido')
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

    const name = interaction.options.getString('filme');
    const movie = await markWatched(name);

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

    const dateStr = new Date(movie.watched_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x57F287)
          .addTextDisplayComponents(txt(`### ✅ Filme marcado como assistido`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `🎬 **${movie.name}**\n` +
            `📅 ${dateStr}`
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(`-# Use /nota para avaliar o filme`)),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
