const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const { defaultColor } = require('../config/config');

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
      const panelEmbed = new EmbedBuilder()
        .setTitle('🏆 Oblivion League — Inscrições Abertas')
        .setColor(defaultColor)
        .setDescription(
          '**Bem-vindo ao sistema de inscrições da Oblivion League!**\n\n' +
          'Clique no botão abaixo para abrir seu ticket de inscrição.\n' +
          'Você precisará preencher:\n\n' +
          '> 🏷️ Nome do Time\n' +
          '> 🔖 Tag\n' +
          '> 👥 Lineup\n' +
          '> 👑 Captain\n' +
          '> 🔄 Reservas\n' +
          '> 🆔 UIDs dos jogadores\n\n' +
          '*Nossa equipe entrará em contato assim que possível.*'
        )
        .setFooter({ text: 'Oblivion League • Sistema de Inscrições' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_open')
          .setLabel('🎟️ Inscrever Time')
          .setStyle(ButtonStyle.Primary)
      );

      await canal.send({ embeds: [panelEmbed], components: [row] });

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
