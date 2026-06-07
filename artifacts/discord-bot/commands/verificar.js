const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { checkPlayer } = require('../utils/banDB');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function gap() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificar')
    .setDescription('Verificar se um UID está banido da Oblivion League')
    .addStringOption(o =>
      o.setName('uid').setDescription('UID do jogador no Free Fire').setRequired(true).setMaxLength(30)
    ),

  async execute(interaction) {
    const uid    = interaction.options.getString('uid').trim();
    const result = checkPlayer(uid);

    if (result.status === 'BANIDO') {
      await interaction.reply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFF4444)
            .addTextDisplayComponents(txt(`### 🚫  BANIDO`))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(
              `**UID:** \`${uid}\`\n` +
              `**Motivo:** ${result.reason}\n` +
              `**Data:** ${result.bannedAt}\n` +
              `**Banido por:** ${result.bannedBy}`
            ))
            .addSeparatorComponents(gap())
            .addTextDisplayComponents(txt(
              `-# 🚫 Este jogador está impedido de participar da Oblivion League.`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    await interaction.reply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x00C851)
          .addTextDisplayComponents(txt(`### ✅  LIMPO`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `**UID:** \`${uid}\`\n` +
            `-# Nenhum registro de banimento encontrado.`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
