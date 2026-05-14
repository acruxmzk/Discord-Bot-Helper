const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { defaultColor } = require('../config/config');

const commands = [
  {
    name: '/setup-squads',
    usage: '/setup-squads',
    description: 'Cria automaticamente os 25 cargos de Squad (Squad 1 ao Squad 25) com a cor padrão laranja. Ignora cargos que já existem.',
    permission: 'Administrador',
    emoji: '⚙️',
  },
  {
    name: '/create-role',
    usage: '/create-role nome:#FF5733 cor:#FF5733',
    description: 'Cria um cargo completamente customizado. Valida a cor no formato HEX e evita duplicatas.',
    permission: 'Administrador',
    emoji: '🎨',
  },
  {
    name: '/add-to-squad',
    usage: '/add-to-squad membro:@usuário numero:3',
    description: 'Adiciona um membro ao cargo de um Squad específico. Verifica se o Squad existe e se o membro já está nele.',
    permission: 'Administrador',
    emoji: '➕',
  },
  {
    name: '/remove-from-squad',
    usage: '/remove-from-squad membro:@usuário numero:3',
    description: 'Remove um membro do cargo de um Squad específico. Avisa caso o membro não esteja no Squad.',
    permission: 'Administrador',
    emoji: '➖',
  },
  {
    name: '/help',
    usage: '/help',
    description: 'Exibe este manual com todos os comandos disponíveis.',
    permission: 'Todos',
    emoji: '📖',
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Exibe o manual de todos os comandos disponíveis'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Manual de Comandos')
      .setDescription('Lista completa de comandos disponíveis neste servidor.\n\u200b')
      .setColor(defaultColor)
      .setFooter({ text: 'Bot de Administração • Apenas Admins podem executar comandos de gestão' })
      .setTimestamp();

    for (const cmd of commands) {
      embed.addFields({
        name: `${cmd.emoji} ${cmd.name}`,
        value: [
          `${cmd.description}`,
          `> **Uso:** \`${cmd.usage}\``,
          `> **Permissão:** ${cmd.permission}`,
          '\u200b',
        ].join('\n'),
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
