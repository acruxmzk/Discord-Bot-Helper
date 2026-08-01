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
      o.setName('uid').setDescription('UID do jogador no COD').setRequired(true).setMaxLength(30)
    )
    .addStringOption(o =>
      o.setName('nick').setDescription('Nick do jogador no COD').setRequired(true).setMaxLength(60)
    )
    .addStringOption(o =>
      o.setName('motivo').setDescription('Motivo do banimento').setRequired(true).setMaxLength(200)
    ),

  async execute(interaction) {
    const uid    = interaction.options.getString('uid').trim();
    const nick   = interaction.options.getString('nick').trim();
    const reason = interaction.options.getString('motivo').trim();

    const anterior = await checkPlayer(uid);
    const update   = anterior.status === 'BANIDO';

    await banPlayer(uid, nick, reason, interaction.user.tag);

    const agora = Math.floor(Date.now() / 1000);

    // ── Log no canal de staff ─────────────────────────────────────────────
    const logCh = findLogChannel(interaction.guild);
    if (logCh) {
      await interaction.guild.roles.fetch().catch(() => {});
      const staffRole = interaction.guild.roles.cache.find(
        r => r.name.toLowerCase() === 'staff'
      );
      const staffMention = staffRole ? `<@&${staffRole.id}>` : '@STAFF';

      await logCh.send({
        content: staffMention,
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFF4444)
            .addTextDisplayComponents(txt(
              `### 🚨 ${update ? 'BAN ATUALIZADO' : 'PLAYER BANIDO'}\n` +
              `**UID:** \`${uid}\`\n` +
              `**Nick:** ${nick}\n` +
              `**Motivo:** ${reason}\n` +
              `**Responsável:** <@${interaction.user.id}>\n` +
              `**Data:** <t:${agora}:F>`
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
            `**Nick:** ${nick}\n` +
            `**Motivo:** ${reason}\n` +
            `**Registrado por:** ${interaction.user.displayName}\n` +
            `**Data:** <t:${agora}:F>`
          ))
          .addSeparatorComponents(gap())
          .addTextDisplayComponents(txt(
            update
              ? `-# ♻️ Registro anterior atualizado.`
              : `-# ✅ UID e nick salvos no banco permanentemente.`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true,
    });
  },
};
