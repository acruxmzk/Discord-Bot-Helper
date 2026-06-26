const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { search, getByName } = require('../utils/movieDB');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Mostra os detalhes de um filme')
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
    const movie = await getByName(name);

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

    const statusIcon = movie.watched ? '☑ Assistido' : '☐ Não assistido';
    const noteStr    = movie.note !== null ? `⭐ ${parseFloat(movie.note)}/10` : '⭐ Sem nota';
    const dateStr    = movie.watched_at
      ? new Date(movie.watched_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
      : '—';

    const color = movie.watched ? 0x57F287 : 0x5865F2;

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(color)
          .addTextDisplayComponents(txt(`### 🎬 ${movie.name}`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `📌 **Status:** ${statusIcon}\n` +
            `${noteStr}\n` +
            `📅 **Assistido em:** ${dateStr}`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
