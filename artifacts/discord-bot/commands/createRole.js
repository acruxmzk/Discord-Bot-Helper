const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { createRole } = require('../utils/createRoleUtil');

const HEX_REGEX = /^#([0-9A-Fa-f]{6})$/;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-role')
    .setDescription('Cria um cargo customizado no servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('nome')
        .setDescription('Nome do cargo')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('cor')
        .setDescription('Cor do cargo em HEX (ex: #FF5733)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const nome = interaction.options.getString('nome');
    const cor = interaction.options.getString('cor');

    if (!HEX_REGEX.test(cor)) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Cor inválida')
        .setColor('#FF0000')
        .setDescription(`A cor \`${cor}\` não é uma cor HEX válida.\nUse o formato: \`#RRGGBB\` (ex: \`#FF5733\`)`)
        .setTimestamp();

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const { role, created } = await createRole(interaction.guild, nome, cor);

      if (!created) {
        const skipEmbed = new EmbedBuilder()
          .setTitle('⚠️ Cargo já existe')
          .setColor(cor)
          .setDescription(`O cargo **${nome}** já existe neste servidor.`)
          .addFields({ name: 'ID do cargo', value: role.id, inline: true })
          .setTimestamp();

        return interaction.editReply({ embeds: [skipEmbed] });
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Cargo criado com sucesso')
        .setColor(cor)
        .addFields(
          { name: '📛 Nome', value: role.name, inline: true },
          { name: '🎨 Cor', value: cor.toUpperCase(), inline: true },
          { name: '🆔 ID', value: role.id, inline: true }
        )
        .setFooter({ text: 'Bot de Administração' })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      console.error('[create-role] Erro:', error);

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Erro ao criar cargo')
        .setColor('#FF0000')
        .setDescription(`Ocorreu um erro: ${error.message}`)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
