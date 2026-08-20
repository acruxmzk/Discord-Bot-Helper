const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { getAll } = require('../utils/movieDB');
const { getRecommendations } = require('../utils/tmdb');

const txt = content => new TextDisplayBuilder().setContent(content);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recomendar')
    .setDescription('✨ Recomenda títulos com base nas suas melhores avaliações'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const movies = await getAll();
    const results = await getRecommendations(movies);
    if (!results.length) {
      await interaction.editReply({
        content: '⚠️ Marque alguns títulos como assistidos e dê notas para receber recomendações personalizadas.',
      });
      return;
    }

    const lines = results.map((item, index) => {
      const title = item.title ?? item.name;
      const year = (item.release_date ?? item.first_air_date ?? '').slice(0, 4);
      const score = item.vote_average ? ` · TMDB ${Number(item.vote_average).toFixed(1)}/10` : '';
      const genres = item.matchedFavoriteGenres?.length
        ? ` · ${item.matchedFavoriteGenres.slice(0, 2).join(', ')}`
        : '';
      const source = item.source ? `\n   -# porque você avaliou **${item.source}** com ${item.sourceNote.toFixed(1)}` : '';
      return `**${index + 1}. [${title}](https://www.themoviedb.org/${item.media_type === 'tv' ? 'tv' : 'movie'}/${item.id})**${year ? ` · ${year}` : ''}${score}${genres}${source}`;
    });
    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x9B59B6)
          .addTextDisplayComponents(txt(`## ✨ Recomendações para você\n-# Baseadas nas suas melhores notas, gêneros favoritos e avaliação do TMDB\n\n${lines.join('\n')}`))
          .addTextDisplayComponents(txt('-# Títulos que já estão na watchlist são removidos automaticamente · TMDB')),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};