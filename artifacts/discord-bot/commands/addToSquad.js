const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { squadCount, squadPrefix, defaultColor } = require('../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-to-squad')
    .setDescription('Adiciona um membro a um squad')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('membro')
        .setDescription('Membro que receberá o cargo de squad')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('numero')
        .setDescription(`Número do squad (1 a ${squadCount})`)
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(squadCount)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('membro');
    const numero = interaction.options.getInteger('numero');
    const roleName = `${squadPrefix} ${numero}`;

    await interaction.deferReply();

    try {
      const [member, roles] = await Promise.all([
        interaction.guild.members.fetch({ user: user.id, force: true }),
        interaction.guild.roles.fetch(),
      ]);
      const role = roles.find(r => r.name === roleName);

      if (!role) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Cargo não encontrado')
          .setColor('#FF0000')
          .setDescription(`O cargo **${roleName}** não existe.\nUse **/setup-squads** primeiro para criar os cargos.`)
          .setTimestamp();

        return interaction.editReply({ embeds: [errorEmbed] });
      }

      if (member.roles.cache.has(role.id)) {
        const warnEmbed = new EmbedBuilder()
          .setTitle('⚠️ Membro já está no squad')
          .setColor('#FFA500')
          .setDescription(`**${user.displayName ?? user.username}** já possui o cargo **${roleName}**.`)
          .setTimestamp();

        return interaction.editReply({ embeds: [warnEmbed] });
      }

      await member.roles.add(role);

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Membro adicionado ao squad')
        .setColor(defaultColor)
        .addFields(
          { name: '👤 Membro', value: `<@${user.id}>`, inline: true },
          { name: '🏷️ Squad', value: roleName, inline: true },
        )
        .setFooter({ text: 'Bot de Administração' })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      console.error('[add-to-squad] Erro:', error);

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Erro ao adicionar membro')
        .setColor('#FF0000')
        .setDescription(`Ocorreu um erro: ${error.message}`)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
