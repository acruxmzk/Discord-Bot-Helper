const {
  SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');
const { getAll }     = require('../utils/movieDB');
const { savePanel }  = require('../utils/panelStore');
const { buildPanelContainer } = require('../utils/buildPanelContainer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Posta o painel fixo do Movie Tracker neste canal'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const movies    = await getAll();
    const container = buildPanelContainer(movies, 'all');

    const msg = await interaction.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    await savePanel(interaction.guildId, interaction.channelId, msg.id);

    await interaction.editReply({
      content: '✅ Painel fixado neste canal! Agora use os comandos nos bastidores e ele atualiza sozinho.',
    });
  },
};
