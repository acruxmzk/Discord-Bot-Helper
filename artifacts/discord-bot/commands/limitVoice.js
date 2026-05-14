const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('limit-voice')
    .setDescription('Define o limite de usuários em um canal de voz')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal de voz a ser limitado')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('limite')
        .setDescription('Número máximo de usuários (0 = sem limite, máx. 99)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(99)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('canal');
    const limite = interaction.options.getInteger('limite');

    await interaction.deferReply();

    try {
      await channel.setUserLimit(limite);

      const successEmbed = new EmbedBuilder()
        .setTitle('🔊 Limite de voz atualizado')
        .setColor('#FFA500')
        .addFields(
          { name: '📢 Canal', value: `<#${channel.id}>`, inline: true },
          {
            name: '👥 Limite',
            value: limite === 0 ? 'Sem limite' : `${limite} pessoa${limite !== 1 ? 's' : ''}`,
            inline: true,
          },
        )
        .setFooter({ text: 'Bot de Administração' })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      console.error('[limit-voice] Erro:', error);

      const msg = error.code === 50013
        ? 'O bot não tem permissão para gerenciar este canal. Certifique-se que o bot possui a permissão **Gerenciar Canais**.'
        : error.message;

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Erro ao definir limite')
        .setColor('#FF0000')
        .setDescription(msg)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
