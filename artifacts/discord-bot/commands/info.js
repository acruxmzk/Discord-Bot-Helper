const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getByName, search } = require('../utils/movieDB');
const { getDetails } = require('../utils/tmdb');

function providers(details) {
  const data = details['watch/providers']?.results?.BR;
  const names = [
    ...(data?.flatrate ?? []),
    ...(data?.free ?? []),
    ...(data?.rent ?? []),
  ].map(provider => provider.provider_name);
  return [...new Set(names)].slice(0, 6).join(', ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('ℹ️ Mostra informações do TMDB sobre um título da watchlist')
    .addStringOption(option =>
      option.setName('filme').setDescription('Título da watchlist').setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const results = await search(interaction.options.getFocused() || '');
    await interaction.respond(results.map(movie => ({ name: movie.name, value: movie.name })));
  },

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const name = interaction.options.getString('filme');
    const movie = await getByName(name);
    if (!movie) {
      await interaction.editReply({ content: '❌ Esse título não está na watchlist. Use `/adicionar` primeiro.' });
      return;
    }

    const details = await getDetails(movie);
    if (!details) {
      await interaction.editReply({ content: '⚠️ Esse título ainda não possui dados do TMDB.' });
      return;
    }

    const title = details.title ?? details.name ?? movie.name;
    const date = details.release_date ?? details.first_air_date;
    const genres = (details.genres ?? []).map(genre => genre.name).join(' · ');
    const duration = details.runtime
      ? `${details.runtime} min`
      : details.number_of_seasons
        ? `${details.number_of_seasons} temporada(s)`
        : null;
    const embed = new EmbedBuilder()
      .setColor(0x01B4E4)
      .setTitle(title)
      .setURL(`https://www.themoviedb.org/${movie.tmdb_media_type === 'tv' ? 'tv' : 'movie'}/${movie.tmdb_id}`)
      .setDescription(details.overview || 'Sinopse não disponível em português.')
      .addFields(
        { name: 'Ano', value: date ? date.slice(0, 4) : '—', inline: true },
        { name: 'Nota TMDB', value: details.vote_average ? `${Number(details.vote_average).toFixed(1)}/10` : '—', inline: true },
        { name: 'Gêneros', value: genres || movie.category || '—', inline: true },
      );
    if (duration) embed.addFields({ name: 'Duração', value: duration, inline: true });
    const available = providers(details);
    if (available) embed.addFields({ name: 'Onde assistir', value: available });
    if (details.poster_path) embed.setThumbnail(`https://image.tmdb.org/t/p/w342${details.poster_path}`);
    embed.setFooter({ text: 'Dados fornecidos por The Movie Database (TMDB)' });

    await interaction.editReply({ embeds: [embed] });
  },
};