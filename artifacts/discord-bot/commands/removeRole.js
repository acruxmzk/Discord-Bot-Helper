const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-role')
    .setDescription('Remove um cargo específico de um membro')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(option =>
      option
        .setName('membro')
        .setDescription('Membro que perderá o cargo')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName('cargo')
        .setDescription('Cargo a ser removido')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('membro');
    const role = interaction.options.getRole('cargo');

    await interaction.deferReply();

    try {
      const [member, botMember] = await Promise.all([
        interaction.guild.members.fetch({ user: user.id, force: true }),
        interaction.guild.members.fetchMe(),
      ]);

      if (role.position >= botMember.roles.highest.position) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ Erro de hierarquia')
              .setColor('#FF0000')
              .setDescription(
                `Não consigo remover o cargo **${role.name}** pois ele está acima do cargo do bot.\n` +
                `Arraste o cargo do bot acima deste cargo nas configurações do servidor.`
              )
              .setTimestamp(),
          ],
        });
      }

      if (!member.roles.cache.has(role.id)) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('⚠️ Membro não possui este cargo')
              .setColor('#FFA500')
              .setDescription(`**${user.displayName ?? user.username}** não possui o cargo **${role.name}**.`)
              .setTimestamp(),
          ],
        });
      }

      await member.roles.remove(role, `Removido via /remove-role por ${interaction.user.tag}`);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('✅ Cargo removido')
            .setColor('#FF4444')
            .addFields(
              { name: '👤 Membro', value: `<@${user.id}>`, inline: true },
              { name: '🏷️ Cargo', value: role.name, inline: true },
            )
            .setFooter({ text: `Ação feita por ${interaction.user.tag}` })
            .setTimestamp(),
        ],
      });
    } catch (error) {
      console.error('[remove-role] Erro:', error);

      const msg = error.code === 50013
        ? 'O bot não tem permissão para gerenciar este cargo.'
        : error.message;

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro ao remover cargo')
            .setColor('#FF0000')
            .setDescription(msg)
            .setTimestamp(),
        ],
      });
    }
  },
};
