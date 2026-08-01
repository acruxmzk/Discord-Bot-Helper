const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { createRole, toSuperscript } = require('../utils/createRoleUtil');
const { defaultColor, squadCount, squadPrefix } = require('../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-squads')
    .setDescription(`Cria ${squadCount} cargos de UNIT no servidor`)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();

    const created = [];
    const skipped = [];

    try {
      for (let i = 1; i <= squadCount; i++) {
        const name = `${squadPrefix}${toSuperscript(i)}`;
        const { role, created: wasCreated } = await createRole(interaction.guild, name, defaultColor);

        if (wasCreated) {
          created.push(role.name);
        } else {
          skipped.push(role.name);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Setup de UNITs concluído')
        .setColor(defaultColor)
        .addFields(
          {
            name: `📦 Criados (${created.length})`,
            value: created.length > 0 ? created.join(', ') : 'Nenhum',
            inline: false,
          },
          {
            name: `⏭️ Já existiam (${skipped.length})`,
            value: skipped.length > 0 ? skipped.join(', ') : 'Nenhum',
            inline: false,
          }
        )
        .setFooter({ text: 'Bot de Administração' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[setup-squads] Erro:', error);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro ao criar UNITs')
            .setColor('#FF0000')
            .setDescription(`Ocorreu um erro: ${error.message}`)
            .setTimestamp(),
        ],
      });
    }
  },
};
