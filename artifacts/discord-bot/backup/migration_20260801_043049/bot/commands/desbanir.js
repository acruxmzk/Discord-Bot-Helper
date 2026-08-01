const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ChannelType,
} = require('discord.js');
const { unbanPlayer, checkPlayer } = require('../utils/banDB');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function gap() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

function findLogChannel(guild) {
  return guild.channels.cache.find(
    c => c.type === ChannelType.GuildText &&
         (c.name.toLowerCase().includes('staff-log') ||
          c.name.toLowerCase().includes('logs') ||
          c.name.toLowerCase().includes('log'))
  ) ?? null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('desbanir')
    .setDescription('Remover banimento de um jogador pelo UID')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName('uid').setDescription('UID do jogador').setRequired(true).setMaxLength(30)
    ),

  async execute(interaction) {
    const uid = interaction.options.getString('uid').trim();

    const antes = checkPlayer(uid);
    if (antes.status === 'LIMPO') {
      await interaction.reply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFFA500)
            .addTextDisplayComponents(txt(
              `### ⚠️ UID Não Encontrado\n\`${uid}\` não está na lista de banidos.`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });
      return;
    }

    unbanPlayer(uid);
    const agora = Math.floor(Date.now() / 1000);

    // ── Log ───────────────────────────────────────────────────────────────
    const logCh = findLogChannel(interaction.guild);
    if (logCh) {
      await logCh.send({
        components: [
          new ContainerBuilder()
            .setAccentColor(0x00C851)
            .addTextDisplayComponents(txt(
              `### ✅ Ban Removido\n` +
              `**UID:** \`${uid}\`\n` +
              `**Removido por:** <@${interaction.user.id}>\n` +
              `**Horário:** <t:${agora}:F>`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
    }

    await interaction.reply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x00C851)
          .addTextDisplayComponents(txt(`### ✅ Ban Removido`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `**UID:** \`${uid}\`\n` +
            `**Motivo anterior:** ${antes.reason}\n` +
            `**Removido por:** ${interaction.user.displayName}`
          ))
          .addSeparatorComponents(gap())
          .addTextDisplayComponents(txt(`-# UID removido do banco de dados.`)),
      ],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true,
    });
  },
};
