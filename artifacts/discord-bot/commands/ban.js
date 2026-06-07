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
const { banPlayer, checkPlayer } = require('../utils/banDB');

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
    .setName('ban')
    .setDescription('Banir um jogador permanentemente pelo UID')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName('uid').setDescription('UID do jogador no Free Fire').setRequired(true).setMaxLength(30)
    )
    .addStringOption(o =>
      o.setName('motivo').setDescription('Motivo do banimento').setRequired(true).setMaxLength(200)
    ),

  async execute(interaction) {
    const uid    = interaction.options.getString('uid').trim();
    const reason = interaction.options.getString('motivo').trim();

    const anterior = checkPlayer(uid);
    const update   = anterior.status === 'BANIDO';

    banPlayer(uid, reason, interaction.user.tag);

    const agora = Math.floor(Date.now() / 1000);

    // ── Log no canal de staff ─────────────────────────────────────────────
    const logCh = findLogChannel(interaction.guild);
    if (logCh) {
      await logCh.send({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFF4444)
            .addTextDisplayComponents(txt(
              `### 🚫 ${update ? 'Ban Atualizado' : 'Novo Ban'}\n` +
              `**UID:** \`${uid}\`\n` +
              `**Motivo:** ${reason}\n` +
              `**Responsável:** <@${interaction.user.id}>\n` +
              `**Registrado em:** <t:${agora}:F>`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
    }

    // ── Resposta ao staff ─────────────────────────────────────────────────
    await interaction.reply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xFF4444)
          .addTextDisplayComponents(txt(
            `### 🚫 ${update ? 'Ban Atualizado' : 'Jogador Banido'}`
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `**UID:** \`${uid}\`\n` +
            `**Motivo:** ${reason}\n` +
            `**Registrado por:** ${interaction.user.displayName}\n` +
            `**Data:** <t:${agora}:F>`
          ))
          .addSeparatorComponents(gap())
          .addTextDisplayComponents(txt(
            update
              ? `-# ♻️ Registro anterior atualizado.`
              : `-# ✅ UID salvo no banco permanentemente.`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true,
    });
  },
};
