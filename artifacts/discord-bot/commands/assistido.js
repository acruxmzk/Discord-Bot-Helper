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

function stars(note) {
  const full = Math.round(parseFloat(note) / 2);
  return '★'.repeat(Math.max(0, full)) + '☆'.repeat(Math.max(0, 5 - full));
}

function noteLabel(note) {
  const n = parseFloat(note);
  if (n >= 9)   return '🏆 Obra-prima';
  if (n >= 7.5) return '🔥 Excelente';
  if (n >= 6)   return '👍 Bom';
  if (n >= 4)   return '😐 Médio';
  return '👎 Fraco';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assistido')
    .setDescription('✅ Marca um filme como assistido e registra a nota')
    .addStringOption(o =>
      o.setName('filme')
        .setDescription('Nome do filme (autocomplete)')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addNumberOption(o =>
      o.setName('nota')
        .setDescription('Avaliação de 0 a 10')
        .setMinValue(0)
        .setMaxValue(10)
        .setRequired(false)
    ),

  async autocomplete(interaction) {
    const results = await search(interaction.options.getFocused() || '');
    await interaction.respond(results.map(m => ({ name: m.name, value: m.name })));
  },

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const name = interaction.options.getString('filme');
    const nota = interaction.options.getNumber('nota') ?? null;

    let movie = await markWatched(name);

    if (!movie) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xE74C3C)
            .addTextDisplayComponents(txt(
              `**${name}** não encontrado.\n` +
              `-# Use /adicionar para incluí-lo primeiro.`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const alreadyWatched = movie.already_watched === true;
    if (nota !== null) movie = await setNote(movie.name, nota) ?? movie;

    const hasNote = movie.note !== null;
    const dateStr = movie.watched_at
      ? new Date(movie.watched_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
      : null;

    // Já assistido, sem nota nova
    if (alreadyWatched && nota === null) {
      const noteStr = hasNote
        ? `${stars(movie.note)}  ${parseFloat(movie.note).toFixed(1)}`
        : `*sem nota — passe a opção nota para avaliar*`;
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xF39C12)
            .addTextDisplayComponents(txt(
              `**${movie.name}**  já estava assistido\n` +
              (dateStr ? `📅 ${dateStr}  ·  ` : '') + noteStr
            ))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(`-# Premiere`)),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      refreshPanel(interaction.guildId).catch(e => console.error('[refreshPanel]', e));
      return;
    }

    const noteStr = hasNote
      ? `${stars(movie.note)}  ${parseFloat(movie.note).toFixed(1)}  ·  ${noteLabel(movie.note)}`
      : `*sem nota — use /nota para avaliar*`;

    const title = alreadyWatched ? `nota atualizada` : `marcado como assistido`;

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x2ECC71)
          .addTextDisplayComponents(txt(
            `✅  **${movie.name}**  —  ${title}\n` +
            (dateStr ? `📅 ${dateStr}  ·  ` : '') + noteStr
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(`-# Premiere`)),
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    refreshPanel(interaction.guildId).catch(e => console.error('[refreshPanel]', e));
  },
};
