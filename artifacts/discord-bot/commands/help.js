const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { defaultColor } = require('../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Exibe o manual de comandos do bot'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📋 Manual de Comandos')
      .setColor(defaultColor)
      .setDescription('Todos os comandos exigem permissão de **Administrador**, exceto `/help`.')
      .addFields(
        {
          name: '🏷️ Cargos',
          value: [
            '`/setup-squads` — Cria os 25 cargos de Squad automaticamente',
            '`/create-role [nome] [cor]` — Cria um cargo com cor personalizada (HEX)',
          ].join('\n'),
        },
        {
          name: '👥 Gestão de Squads',
          value: [
            '`/add-to-squad [@membro] [número]` — Adiciona alguém a um Squad',
            '`/remove-from-squad [@membro] [número]` — Remove alguém de um Squad',
          ].join('\n'),
        },
        {
          name: '🏠 Servidor',
          value: [
            '`/private-category [nome] [cargo?]` — Torna uma categoria privada',
            '`/limit-voice [canal] [limite]` — Limita usuários em canal de voz (0 = sem limite)',
          ].join('\n'),
        },
        {
          name: '❓ Ajuda',
          value: '`/help` — Exibe este manual',
        }
      )
      .setFooter({ text: 'Bot de Administração' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
