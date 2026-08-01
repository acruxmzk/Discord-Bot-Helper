const {
  SlashCommandBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require('discord.js');
const { FAQ_DB } = require('../utils/faqMatcher');

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = (s) => new TextDisplayBuilder().setContent(s);

const STARTED_AT = new Date();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('Gerencia o sistema de FAQ automático da Oblivion League')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub.setName('status').setDescription('Exibe o status do sistema de FAQ')
    )
    .addSubcommand(sub =>
      sub.setName('atualizar').setDescription('Confirma que a base de FAQ está atualizada')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'status') {
      const uptime = Math.floor((Date.now() - STARTED_AT.getTime()) / 1000);
      const hh = String(Math.floor(uptime / 3600)).padStart(2, '0');
      const mm = String(Math.floor((uptime % 3600) / 60)).padStart(2, '0');
      const ss = String(uptime % 60).padStart(2, '0');

      const container = new ContainerBuilder()
        .setAccentColor(0x57F287)
        .addTextDisplayComponents(txt('### ❓  FAQ — Status do Sistema'))
        .addSeparatorComponents(gap())
        .addTextDisplayComponents(txt(
          `✅  Sistema **ativo** e monitorando o canal\n` +
          `📚  **${FAQ_DB.length}** perguntas cadastradas\n` +
          `⏱️  Uptime: **${hh}:${mm}:${ss}**`
        ))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(txt(
          '**Canais monitorados:**\n' +
          '> Qualquer canal com: `perguntas-frequentes`, `perguntas`, `faq`, `duvidas`'
        ))
        .addSeparatorComponents(gap())
        .addTextDisplayComponents(txt('-# 🌐 Oblivion League · FAQ Automático'));

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });
    }

    if (sub === 'atualizar') {
      const container = new ContainerBuilder()
        .setAccentColor(0x57F287)
        .addTextDisplayComponents(txt('### 🔄  FAQ — Base Atualizada'))
        .addSeparatorComponents(gap())
        .addTextDisplayComponents(txt(
          `✅  Base de dados sincronizada com o regulamento atual.\n` +
          `📚  **${FAQ_DB.length}** perguntas carregadas e prontas.\n` +
          `🕒  Atualizado em: **${new Date().toLocaleString('pt-BR')}**`
        ))
        .addSeparatorComponents(gap())
        .addTextDisplayComponents(txt('-# 🌐 Oblivion League · FAQ Automático'));

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });
    }
  },
};
