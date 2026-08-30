const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require('discord.js');
const { addMovie, getByTmdbId, markWatched, setNote, updateTmdbMetadata } = require('../utils/movieDB');
const { findTitle, lookupMovie, syncMovieIfMissing } = require('../utils/tmdb');
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

    let tmdbMatch = null;
    try {
      tmdbMatch = await findTitle(name);
    } catch (error) {
      console.error('[TMDB] Falha ao buscar no /adicionar:', error.message);
    }

    const equivalent = tmdbMatch ? await getByTmdbId(tmdbMatch.id) : null;
    const added = equivalent ?? await addMovie(name);

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
    if (!equivalent && tmdbMatch) {
      try {
        const metadata = await lookupMovie(name);
        movie = await updateTmdbMetadata(added.id, metadata) ?? movie;
      } catch (error) {
        console.error('[TMDB] Falha ao enriquecer filme:', error.message);
      }
    }

    if (equivalent) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xF39C12)
            .addTextDisplayComponents(txt(
              `**${equivalent.name}**\n` +
              `-# já existe na watchlist  ·  título equivalente encontrado no TMDB`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    if (watched || nota !== null) movie = await markWatched(name) ?? movie;
    if (nota !== null)            movie = await setNote(name, nota) ?? movie;

    const isWatched = movie.watched;
    if (isWatched) {
      const durationSync = await syncMovieIfMissing(movie);
      movie = durationSync.movie;
      if (durationSync.error) {
        console.error(`[TMDB] Falha ao buscar duração de "${movie.name}":`, durationSync.error.message);
      }
    }
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
