const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require('discord.js');
const { addMovie, markWatched, setNote } = require('../utils/movieDB');
const { refreshPanel } = require('../utils/refreshPanel');

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
    .setName('adicionar')
    .setDescription('🎬 Adiciona um novo filme à watchlist do Premiere')
    .addStringOption(o =>
      o.setName('filme').setDescription('Nome do filme').setRequired(true).setMaxLength(200)
    )
    .addBooleanOption(o =>
      o.setName('assistido').setDescription('Já assistiu?').setRequired(false)
    )
    .addNumberOption(o =>
      o.setName('nota')
        .setDescription('Avaliação de 0 a 10')
        .setMinValue(0).setMaxValue(10).setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const name    = interaction.options.getString('filme').trim();
    const watched = interaction.options.getBoolean('assistido') ?? false;
    const nota    = interaction.options.getNumber('nota') ?? null;

    const added = await addMovie(name);

    if (!added) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xE74C3C)
            .addTextDisplayComponents(txt(
              `**${name}**\n` +
              `-# já está na watchlist  ·  use /assistido ou /nota para atualizar`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    let movie = added;
    if (watched || nota !== null) movie = await markWatched(name) ?? movie;
    if (nota !== null)            movie = await setNote(name, nota) ?? movie;

    const isWatched = movie.watched;
    const n         = movie.note !== null ? parseFloat(movie.note) : null;

    const details = isWatched
      ? [
          n !== null ? `${stars(n)}  ${n.toFixed(1)}` : null,
          n !== null ? noteLabel(n) : null,
        ].filter(Boolean).join('  ·  ')
      : 'na fila';

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(isWatched ? 0x2ECC71 : 0x9B59B6)
          .addTextDisplayComponents(txt(
            `**${movie.name}**\n` +
            `-# ${isWatched ? '✅' : '⏳'}  ${details}`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    refreshPanel(interaction.guildId).catch(e => console.error('[refreshPanel]', e));
  },
};
