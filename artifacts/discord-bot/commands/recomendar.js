const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { getAll, search } = require('../utils/movieDB');
const { getRecommendations, syncAllMovies } = require('../utils/tmdb');

const txt = content => new TextDisplayBuilder().setContent(content);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recomendar')
    .setDescription('✨ Recomenda títulos parecidos com um filme específico')
    .addStringOption(option =>
      option
        .setName('filme')
        .setDescription('Filme-foco (opcional; sem ele escolhe um favorito)')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const results = await search(interaction.options.getFocused() || '');
    await interaction.respond(results.map(movie => ({ name: movie.name, value: movie.name })));
  },

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // A lista pode ter sido importada sem metadados do TMDB. Sincronizar aqui
    // uma vez (o próprio sync usa tmdb_synced_at para evitar repetição)
    // garante que qualquer título assistido e avaliado possa ser usado como
    // base, não apenas os primeiros itens antigos da lista.
    const sync = await syncAllMovies();
    const movies = await getAll();
    const anchorName = interaction.options.getString('filme');
    const anchor = anchorName
      ? movies.find(movie => movie.name.toLowerCase() === anchorName.toLowerCase() && movie.tmdb_id)
      : null;
    if (anchorName && !anchor) {
      await interaction.editReply({ content: '❌ Escolha um título da watchlist com dados disponíveis no TMDB.' });
      return;
    }
    const results = await getRecommendations(movies, { anchorName });
    if (!results.length) {
      await interaction.editReply({
        content: sync.failed
          ? `⚠️ Não foi possível sincronizar ${sync.failed} título(s) com o TMDB. Marque títulos como assistidos e dê notas para receber recomendações personalizadas.`
          : '⚠️ Marque alguns títulos como assistidos e dê notas para receber recomendações personalizadas.',
      });
      return;
    }

    const focus = results[0]?.source;
    const lines = results.map((item, index) => {
      const title = item.title ?? item.name;
      const year = (item.release_date ?? item.first_air_date ?? '').slice(0, 4);
      const score = item.vote_average ? ` · TMDB ${Number(item.vote_average).toFixed(1)}/10` : '';
      const genres = item.matchedFavoriteGenres?.length
        ? ` · ${item.matchedFavoriteGenres.slice(0, 2).join(', ')}`
        : '';
      const source = item.source && item.sourceNote > 0
        ? `\n   -# relacionado a **${item.source}** · sua nota ${item.sourceNote.toFixed(1)}`
        : '';
      return `**${index + 1}. [${title}](https://www.themoviedb.org/${item.media_type === 'tv' ? 'tv' : 'movie'}/${item.id})**${year ? ` · ${year}` : ''}${score}${genres}${source}`;
    });
    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x9B59B6)
          .addTextDisplayComponents(txt(`## ✨ Recomendações${focus ? ` parecidas com ${focus}` : ''}\n-# Um filme-foco por execução · similares, recomendações e avaliação do TMDB\n\n${lines.join('\n')}`))
          .addTextDisplayComponents(txt('-# Cada execução pode trazer uma combinação diferente · títulos da watchlist são removidos automaticamente')),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};