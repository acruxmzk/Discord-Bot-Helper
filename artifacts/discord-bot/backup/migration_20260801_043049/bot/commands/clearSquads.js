const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { toSuperscript } = require('../utils/createRoleUtil');
const { squadCount, squadPrefix } = require('../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear-squads')
    .setDescription('Remove todos os membros dos cargos UNIT, mantendo os cargos intactos')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();

    let totalRemoved = 0;
    const rolesCleared = [];
    const errors = [];

    try {
      await interaction.guild.roles.fetch();
      await interaction.guild.members.fetch();

      for (let i = 1; i <= squadCount; i++) {
        const name = `${squadPrefix}${toSuperscript(i)}`;
        const role = interaction.guild.roles.cache.find(r => r.name === name);

        if (!role || role.members.size === 0) continue;

        const members = [...role.members.values()];

        for (const member of members) {
          try {
            await member.roles.remove(role, 'Limpeza via /clear-squads');
            totalRemoved++;
          } catch {
            errors.push(`${member.user.username} → ${name}`);
          }
          await new Promise(r => setTimeout(r, 300));
        }

        rolesCleared.push(`${name} (${members.length})`);
      }

      const embed = new EmbedBuilder()
        .setTitle('🧹 Limpeza de UNITs concluída')
        .setColor('#FFA500')
        .setDescription(
          rolesCleared.length > 0
            ? `**${totalRemoved}** membro(s) removido(s) de **${rolesCleared.length}** UNIT(s).`
            : 'Nenhum membro encontrado nos cargos de UNIT.'
        )
        .addFields(
          {
            name: `📋 UNITs limpas (${rolesCleared.length})`,
            value: rolesCleared.length > 0 ? rolesCleared.join('\n') : 'Nenhuma',
            inline: false,
          },
        )
        .setFooter({ text: 'Bot de Administração — cargos mantidos' })
        .setTimestamp();

      if (errors.length > 0) {
        embed.addFields({
          name: `❌ Erros (${errors.length})`,
          value: errors.slice(0, 10).join('\n'),
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[clear-squads] Erro:', error);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro ao limpar UNITs')
            .setColor('#FF0000')
            .setDescription(`Ocorreu um erro: ${error.message}`)
            .setTimestamp(),
        ],
      });
    }
  },
};
