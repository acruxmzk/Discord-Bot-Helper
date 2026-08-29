const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { getAll, getByName } = require('../utils/movieDB');
const { syncAllMovies, syncMovie } = require('../utils/tmdb');
const {
  formatMinutes,
  formatMovieDuration,
  sumDurations,
  countKnownDurations,
} = require('../utils/duration');

function sep() {
  return new SeparatorBuilder()
    .setSpacing(SeparatorSpacingSize.Small)
    .setDivider(true);
}

function txt(content) {
  return new TextDisplayBuilder().setContent(content);
}

function typeLabel(movie) {
  return movie.tmdb_media_type === 'tv' ? '📺 Série/programa' : '🎬 Filme';
}

function listLine(movie, index) {
  const number = String(index).padStart(2, '0');
  const status = movie.watched ? '✅' : '☐';
  const duration = formatMovieDuration(movie) ?? 'não informado pelo TMDB';
  return `\`${number}\` ${status} ${typeLabel(movie)}  **${movie.name}**  ·  ⏱ ${duration}`;
}

function buildListContainer(movies, sync) {
  const known = countKnownDurations(movies);
  const total = formatMinutes(sumDurations(movies)) ?? '0 min';
  const unknown = movies.length - known;
  const lines = movies.map(listLine);
  const container = new ContainerBuilder()
    .setAccentColor(0x01B4E4)
    .addTextDisplayComponents(txt(
      `# ⏱  D U R A Ç Ã O  D O S  A S S I S T I D O S\n` +
      `-# Tempo dos filmes, séries e programas já vistos`
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      `**${total}** assistidos  ·  **${known}/${movies.length}** sincronizados` +
      (unknown ? `  ·  ${unknown} sem duração` : '') +
      `\n-# TMDB: ${sync.synced} atualizado(s)` +
      (sync.failed ? ` · ${sync.failed} falha(s)` : '')
    ))
    .addSeparatorComponents(sep());

  for (let start = 0; start < lines.length; start += 8) {
    container.addTextDisplayComponents(txt(lines.slice(start, start + 8).join('\n')));
    if (start + 8 < lines.length) container.addSeparatorComponents(sep());
  }
  return container;
}

function buildSingleContainer(movie) {
  const duration = formatMovieDuration(movie);
  const details = duration
    ? `⏱ **${duration}**`
    : '⚠️ O TMDB não informou uma duração para este título.';
  return new ContainerBuilder()
    .setAccentColor(duration ? 0x01B4E4 : 0xF39C12)
    .addTextDisplayComponents(txt(
      `# ⏱  Duração\n` +
      `## ${movie.name}\n` +
      `-# ${typeLabel(movie)}\n\n` +
      details
    ))
    .addTextDisplayComponents(txt(
      movie.tmdb_id
        ? '-# Dados atualizados em tempo real pelo TMDB.'
        : '-# Este título não foi localizado no TMDB.'
    ));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duracao')
    .setDescription('⏱️ Mostra a duração de filmes, séries e programas pelo TMDB')
    .addStringOption(option =>
      option
        .setName('filme')
        .setDescription('Título específico (opcional)')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const { search } = require('../utils/movieDB');
    const results = await search(interaction.options.getFocused() || '');
    await interaction.respond(results.map(movie => ({
      name: movie.name,
      value: movie.name,
    })));
  },

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const name = interaction.options.getString('filme');

    if (name) {
      const movie = await getByName(name);
      if (!movie) {
        await interaction.editReply({
          content: '❌ Esse título não está na watchlist. Use `/adicionar` primeiro.',
        });
        return;
      }

      const result = await syncMovie(movie);
      await interaction.editReply({
        components: [buildSingleContainer(result.movie ?? movie)],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const sync = await syncAllMovies({ watchedOnly: true });
    const movies = (await getAll()).filter(movie => movie.watched);
    await interaction.editReply({
      components: [buildListContainer(movies, sync)],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};