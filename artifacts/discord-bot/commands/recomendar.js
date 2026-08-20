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
      return `**${index + 1}. ${title}**${year ? ` · ${year}` : ''}${score}`;
    });
    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x9B59B6)
          .addTextDisplayComponents(txt(`## ✨ Recomendações para você\n${lines.join('\n')}`))
          .addTextDisplayComponents(txt('-# Baseado nos seus títulos assistidos e melhor avaliados · TMDB')),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};