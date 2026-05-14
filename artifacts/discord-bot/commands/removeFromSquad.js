const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { toSuperscript } = require('../utils/createRoleUtil');
const { squadCount, squadPrefix } = require('../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-from-squad')
    .setDescription('Remove um membro de uma UNIT')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('membro')
        .setDescription('Membro que perderá o cargo de UNIT')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('numero')
        .setDescription(`Número da UNIT (1 a ${squadCount})`)
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(squadCount)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('membro');
    const numero = interaction.options.getInteger('numero');
    const roleName = `${squadPrefix}${toSuperscript(numero)}`;

    await interaction.deferReply();

    try {
      const [member, roles] = await Promise.all([
        interaction.guild.members.fetch({ user: user.id, force: true }),
        interaction.guild.roles.fetch(),
      ]);
      const role = roles.find(r => r.name === roleName);

      if (!role) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ Cargo não encontrado')
              .setColor('#FF0000')
              .setDescription(`O cargo **${roleName}** não existe.\nUse **/setup-squads** primeiro para criar os cargos.`)
              .setTimestamp(),
          ],
        });
      }

      if (!member.roles.cache.has(role.id)) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('⚠️ Membro não está na UNIT')
              .setColor('#FFA500')
              .setDescription(`**${user.displayName ?? user.username}** não possui o cargo **${roleName}**.`)
              .setTimestamp(),
          ],
        });
      }

      const botMember = await interaction.guild.members.fetchMe();
      if (role.position >= botMember.roles.highest.position) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ Erro de hierarquia')
              .setColor('#FF0000')
              .setDescription(
                `Não consigo remover o cargo **${roleName}** pois ele está **acima ou igual** ao cargo mais alto do bot.\n\n` +
                `**Solução:** Vá em **Configurações do Servidor → Cargos** e arraste o cargo do bot para **acima** de todos os cargos de UNIT.`
              )
              .setTimestamp(),
          ],
        });
      }

      await member.roles.remove(role);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('✅ Membro removido da UNIT')
            .setColor('#FF4444')
            .addFields(
              { name: '👤 Membro', value: `<@${user.id}>`, inline: true },
              { name: '🏷️ UNIT', value: roleName, inline: true },
            )
            .setFooter({ text: 'Bot de Administração' })
            .setTimestamp(),
        ],
      });
    } catch (error) {
      console.error('[remove-from-squad] Erro completo:', error);

      const msg = error.code === 50013
        ? 'O bot não tem permissão para gerenciar este cargo. Verifique a hierarquia de cargos no servidor.'
        : error.message;

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro ao remover membro')
            .setColor('#FF0000')
            .setDescription(msg)
            .setTimestamp(),
        ],
      });
    }
  },
};
