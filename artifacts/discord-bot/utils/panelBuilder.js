const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

const DIVIDER = '┈┈┈┈┈┈┈┈┈┈';

function buildTicketPanel() {
  const container = new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '╭━━━〔 🏆 𝐎𝐁𝐋𝐈𝐕𝐈𝐎𝐍 𝐋𝐄𝐀𝐆𝐔𝐄 〕━━━╮\n' +
        '\nㅤBem-vindo ao sistema oficial de inscrições.\n'
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        DIVIDER + '\n\n' +
        '📋 𝐏𝐀𝐑𝐀 𝐈𝐍𝐒𝐂𝐑𝐄𝐕𝐄𝐑 𝐒𝐄𝐔 𝐓𝐈𝐌𝐄:\n\n' +
        '• Nome do Time\n' +
        '• Tag da Organização\n' +
        '• Lineup Completa\n' +
        '• Captain\n' +
        '• Reservas\n' +
        '• UID de todos os jogadores'
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        DIVIDER + '\n\n' +
        '🎟️ Ao clicar no botão abaixo:\n\n' +
        '・Um ticket privado será criado\n' +
        '・Apenas o staff terá acesso\n' +
        '・Nossa equipe analisará sua inscrição\n' +
        '・Evite abrir múltiplos tickets'
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        DIVIDER + '\n\n' +
        '⚠️ 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐂̧𝐎̃𝐄𝐒\n\n' +
        '• Inscrições sujeitas à aprovação\n' +
        '• Dados incorretos podem invalidar a inscrição\n' +
        '• Respeite o prazo do campeonato\n\n' +
        DIVIDER + '\n\n' +
        '╰━━━〔 ⚔️ 𝐎𝐁𝐋𝐈𝐕𝐈𝐎𝐍 〕━━━╯'
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_open')
          .setLabel('🎟️ Inscrever Time')
          .setStyle(ButtonStyle.Primary)
      )
    );

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

module.exports = { buildTicketPanel };
