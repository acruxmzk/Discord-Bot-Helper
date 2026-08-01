const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { buildTicketPanel } = require('../utils/panelBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-league-ticket')
    .setDescription('Envia o painel de inscrições da Oblivion League em um canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal onde o painel de inscrições será enviado')
        .setRequired(true)
    ),

  async execute(interaction) {
    const canal = interaction.options.getChannel('canal');

    await interaction.deferReply({ ephemeral: true });

    try {
      await canal.send(buildTicketPanel());

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('✅ Painel enviado!')
            .setColor('#00C851')
            .setDescription(`O painel de inscrições foi enviado em <#${canal.id}>.`)
            .setTimestamp(),
        ],
      });
    } catch (error) {
      console.error('[setup-league-ticket] Erro:', error);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro ao enviar painel')
            .setColor('#FF0000')
            .setDescription(`Ocorreu um erro: ${error.message}`)
            .setTimestamp(),
        ],
      });
    }
  },
};
