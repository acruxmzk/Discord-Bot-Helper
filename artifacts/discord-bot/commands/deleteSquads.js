const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { toSuperscript } = require('../utils/createRoleUtil');
const { squadCount, squadPrefix, defaultColor } = require('../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete-squads')
    .setDescription(`Remove todos os ${squadCount} cargos de UNIT do servidor`)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();

    const deleted = [];
    const notFound = [];
    const errors = [];

    try {
      await interaction.guild.roles.fetch();
      const botMember = await interaction.guild.members.fetchMe();

      for (let i = 1; i <= squadCount; i++) {
        const name = `${squadPrefix}${toSuperscript(i)}`;
        const role = interaction.guild.roles.cache.find(r => r.name === name);

        if (!role) {
          notFound.push(name);
          continue;
        }

        if (role.position >= botMember.roles.highest.position) {
          errors.push(`${name} (hierarquia)`);
          continue;
        }

        try {
          await role.delete('Removido pelo comando /delete-squads');
          deleted.push(name);
        } catch {
          errors.push(name);
        }

        await new Promise(r => setTimeout(r, 350));
      }

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Delete de UNITs concluído')
        .setColor('#FF4444')
        .addFields(
          {
            name: `✅ Removidos (${deleted.length})`,
            value: deleted.length > 0 ? deleted.join(', ') : 'Nenhum',
            inline: false,
          },
          {
            name: `⚠️ Não encontrados (${notFound.length})`,
            value: notFound.length > 0 ? notFound.join(', ') : 'Nenhum',
            inline: false,
          },
        )
        .setFooter({ text: 'Bot de Administração' })
        .setTimestamp();

      if (errors.length > 0) {
        embed.addFields({
          name: `❌ Erros (${errors.length})`,
          value: errors.join(', '),
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[delete-squads] Erro:', error);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro ao deletar UNITs')
            .setColor('#FF0000')
            .setDescription(`Ocorreu um erro: ${error.message}`)
            .setTimestamp(),
        ],
      });
    }
  },
};
