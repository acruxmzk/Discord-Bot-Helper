const {
  SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');
const { getAll } = require('../utils/movieDB');
const { buildFilmesContainer } = require('../handlers/filmesHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filmes')
    .setDescription('Lista todos os filmes da watchlist'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const movies    = await getAll();
    const container = buildFilmesContainer(movies, 'all');

    await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
