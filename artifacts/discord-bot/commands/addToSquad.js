const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { toSuperscript } = require('../utils/createRoleUtil');
const { squadCount, squadPrefix, defaultColor } = require('../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-to-squad')
    .setDescription('Adiciona um membro a uma UNIT')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('membro')
        .setDescription('Membro que receberá o cargo de UNIT')
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

      if (member.roles.cache.has(role.id)) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('⚠️ Membro já está na UNIT')
              .setColor('#FFA500')
              .setDescription(`**${user.displayName ?? user.username}** já possui o cargo **${roleName}**.`)
              .setTimestamp(),
          ],
        });
      }

      await member.roles.add(role);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('✅ Membro adicionado à UNIT')
            .setColor(defaultColor)
            .addFields(
              { name: '👤 Membro', value: `<@${user.id}>`, inline: true },
              { name: '🏷️ UNIT', value: roleName, inline: true },
            )
            .setFooter({ text: 'Bot de Administração' })
            .setTimestamp(),
        ],
      });
    } catch (error) {
      console.error('[add-to-squad] Erro:', error);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro ao adicionar membro')
            .setColor('#FF0000')
            .setDescription(`Ocorreu um erro: ${error.message}`)
            .setTimestamp(),
        ],
      });
    }
  },
};
