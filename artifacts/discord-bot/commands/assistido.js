const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { search, markWatched, setNote } = require('../utils/movieDB');
const { refreshPanel } = require('../utils/refreshPanel');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assistido')
    .setDescription('Marca um filme como assistido e opcionalmente registra a nota')
    .addStringOption(o =>
      o.setName('filme')
        .setDescription('Nome do filme')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addNumberOption(o =>
      o.setName('nota')
        .setDescription('Nota de 0 a 10 (opcional)')
        .setMinValue(0)
        .setMaxValue(10)
    ),

  async autocomplete(interaction) {
    const query = interaction.options.getFocused();
    const results = await search(query || '');
    await interaction.respond(results.map(m => ({ name: m.name, value: m.name })));
  },

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const name = interaction.options.getString('filme');
    const nota = interaction.options.getNumber('nota');

    let movie = await markWatched(name);

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

    const alreadyWatched = movie.already_watched === true;

    if (nota !== null) {
      movie = await setNote(movie.name, nota) ?? movie;
    } else if (alreadyWatched) {
      // Já estava assistido e não veio nota nova — nada a fazer
      const dateStr = new Date(movie.watched_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      const noteStr = movie.note !== null ? `\n⭐ **${parseFloat(movie.note)}/10**` : '';
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFEE75C)
            .addTextDisplayComponents(txt(`### ⚠️ Filme já estava marcado como assistido`))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(
              `🎬 **${movie.name}**\n` +
              `📅 ${dateStr}` +
              noteStr +
              `\n\n*Use a opção \`nota\` para atualizar a nota sem mudar a data.*`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      refreshPanel(interaction.guildId).catch(() => {});
      return;
    }

    const dateStr = new Date(movie.watched_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const noteStr = movie.note !== null ? `\n⭐ **${parseFloat(movie.note)}/10**` : '';

    const title = alreadyWatched
      ? `### 📝 Nota atualizada`
      : `### ✅ Filme marcado como assistido`;

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x57F287)
          .addTextDisplayComponents(txt(title))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `🎬 **${movie.name}**\n` +
            `📅 ${dateStr}` +
            noteStr
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    refreshPanel(interaction.guildId).catch(() => {});
  },
};
