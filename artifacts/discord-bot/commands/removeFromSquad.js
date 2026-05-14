const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { squadCount, squadPrefix } = require('../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-from-squad')
    .setDescription('Remove um membro de um squad')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('membro')
        .setDescription('Membro que perderá o cargo de squad')
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

      if (!member.roles.cache.has(role.id)) {
        const warnEmbed = new EmbedBuilder()
          .setTitle('⚠️ Membro não está no squad')
          .setColor('#FFA500')
          .setDescription(`**${user.displayName ?? user.username}** não possui o cargo **${roleName}**.`)
          .setTimestamp();

        return interaction.editReply({ embeds: [warnEmbed] });
      }

      const botMember = await interaction.guild.members.fetchMe();
      if (role.position >= botMember.roles.highest.position) {
        const hierEmbed = new EmbedBuilder()
          .setTitle('❌ Erro de hierarquia')
          .setColor('#FF0000')
          .setDescription(
            `Não consigo remover o cargo **${roleName}** pois ele está **acima ou igual** ao cargo mais alto do bot na hierarquia.\n\n` +
            `**Solução:** No Discord, vá em **Configurações do Servidor → Cargos** e arraste o cargo do bot (**Lima.gg**) para **acima** de todos os cargos de Squad.`
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [hierEmbed] });
      }

      await member.roles.remove(role);

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Membro removido do squad')
        .setColor('#FF4444')
        .addFields(
          { name: '👤 Membro', value: `<@${user.id}>`, inline: true },
          { name: '🏷️ Squad', value: roleName, inline: true },
        )
        .setFooter({ text: 'Bot de Administração' })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      console.error('[remove-from-squad] Erro completo:', error);

      const msg = error.code === 50013
        ? 'O bot não tem permissão para gerenciar este cargo. Verifique a hierarquia de cargos no servidor.'
        : error.message;

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Erro ao remover membro')
        .setColor('#FF0000')
        .setDescription(msg)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
