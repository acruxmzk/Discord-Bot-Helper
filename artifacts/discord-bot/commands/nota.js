const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require('discord.js');
const { search, getByName, setNote, markWatched } = require('../utils/movieDB');
const { syncMovieIfMissing } = require('../utils/tmdb');
const { refreshPanel }    = require('../utils/refreshPanel');

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

function noteColor(note) {
  const n = parseFloat(note);
  if (n >= 8)  return 0x2ECC71;
  if (n >= 6)  return 0xF39C12;
  if (n >= 4)  return 0xE67E22;
  return 0xE74C3C;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nota')
    .setDescription('⭐ Registra ou atualiza a avaliação de um filme (0 a 10)')
    .addStringOption(o =>
      o.setName('filme').setDescription('Nome do filme (autocomplete)').setRequired(true).setAutocomplete(true)
    )
    .addNumberOption(o =>
      o.setName('nota').setDescription('Avaliação de 0 a 10').setRequired(true).setMinValue(0).setMaxValue(10)
    ),

  async autocomplete(interaction) {
    const results = await search(interaction.options.getFocused() || '');
    await interaction.respond(results.map(m => ({ name: m.name, value: m.name })));
  },

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const name = interaction.options.getString('filme');
    const nota = interaction.options.getNumber('nota');

    // Nota só pode ser aplicada a um título já existente na watchlist.
    const listedMovie = await getByName(name);
    if (!listedMovie) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xE74C3C)
            .addTextDisplayComponents(txt(
              `**${name}**\n` +
              `-# não está na lista  ·  escolha um título do autocomplete ou use /adicionar`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    // Dar uma nota pressupõe que o filme foi assistido. Para filmes já
    // assistidos, markWatched preserva a data original.
    let movie = await markWatched(listedMovie.name);
    if (movie) movie = await setNote(movie.name, nota) ?? movie;

    if (!movie) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xE74C3C)
            .addTextDisplayComponents(txt(
              `**${name}**\n` +
              `-# não encontrado  ·  use /adicionar para incluí-lo`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const durationSync = await syncMovieIfMissing(movie);
    movie = durationSync.movie;
    if (durationSync.error) {
      console.error(`[TMDB] Falha ao buscar duração de "${movie.name}":`, durationSync.error.message);
    }

    const n = parseFloat(movie.note);

    // Atualiza o painel antes de confirmar para o usuário, garantindo que
    // a nova nota apareça imediatamente na mensagem fixa.
    await refreshPanel(interaction.guildId)
      .catch(e => console.error('[refreshPanel]', e));

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(noteColor(n))
          .addTextDisplayComponents(txt(
            `**${movie.name}**\n` +
            `-# ${stars(n)}  ${n.toFixed(1)}  ·  ${noteLabel(n)}`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
