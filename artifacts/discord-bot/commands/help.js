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
      .setDescription('Comandos marcados com 🔒 exigem permissão de **Administrador**. Comandos com 🛡️ exigem **Gerenciar Cargos**.')
      .addFields(
        {
          name: '⚙️ Setup de UNITs',
          value: [
            '🔒 `/setup-squads` — Cria UNIT¹ até UNIT²⁵ (ignora duplicatas)',
            '🔒 `/delete-squads` — Remove todos os cargos UNIT do servidor',
            '🔒 `/clear-squads` — Remove todos os membros das UNITs, mantendo os cargos',
          ].join('\n'),
        },
        {
          name: '🏷️ Cargos',
          value: [
            '🔒 `/create-role [nome] [cor]` — Cria cargo customizado com cor HEX',
            '🛡️ `/add-role [@membro] [cargo]` — Adiciona qualquer cargo a um membro',
            '🛡️ `/remove-role [@membro] [cargo]` — Remove um cargo de um membro',
          ].join('\n'),
        },
        {
          name: '👥 Gestão de UNITs',
          value: [
            '🔒 `/add-to-squad [@membro] [número]` — Adiciona membro a uma UNIT',
            '🔒 `/remove-from-squad [@membro] [número]` — Remove membro de uma UNIT',
            '🔒 `/move-squad [@membro] [número]` — Move membro para outra UNIT (remove a anterior)',
          ].join('\n'),
        },
        {
          name: '🏠 Servidor',
          value: [
            '🔒 `/private-category [nome] [cargo]` — Cria categoria visível só para o cargo',
            '🔒 `/limit-voice [canal] [limite]` — Limita usuários em canal de voz (0 = sem limite)',
          ].join('\n'),
        },
        {
          name: '❓ Ajuda',
          value: '`/help` — Exibe este manual',
        }
      )
      .setFooter({ text: 'Bot de Administração • Oblivion League' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
