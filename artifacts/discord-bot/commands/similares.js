const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { getByName, search } = require('../utils/movieDB');
const { getSimilar } = require('../utils/tmdb');

const txt = content => new TextDisplayBuilder().setContent(content);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('similares')
    .setDescription('🎞️ Encontra títulos semelhantes no TMDB')
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
      await interaction.editReply({ content: '❌ Esse título não está na watchlist.' });
      return;
    }
    const results = await getSimilar(movie);
    if (!results.length) {
      await interaction.editReply({ content: '⚠️ O TMDB não encontrou títulos semelhantes para esse item.' });
      return;
    }

    const lines = results.map((item, index) => {
      const title = item.title ?? item.name;
      const year = (item.release_date ?? item.first_air_date ?? '').slice(0, 4);
      const score = item.vote_average ? ` · ${Number(item.vote_average).toFixed(1)}/10` : '';
      return `**${index + 1}. ${title}**${year ? ` · ${year}` : ''}${score}`;
    });
    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x01B4E4)
          .addTextDisplayComponents(txt(`## 🎞️ Semelhantes a ${movie.name}\n${lines.join('\n')}`))
          .addTextDisplayComponents(txt('-# Resultados recomendados pelo TMDB')),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};