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

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function gap() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

function buildTicketPanel() {
  const containers = [];

  // ── Header ────────────────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(0xFFA500)
      .addTextDisplayComponents(txt(
        '### 🏆  OBLIVION LEAGUE — INSCRIÇÕES\n' +
        '-# Torneio Oficial de Free Fire · Edição 2026'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '📅  **Cronograma**\n\n' +
        '🎯  **1ª Classificatória** — 08/07/2026 às 20h00\n' +
        '🎯  **2ª Classificatória** — 09/07/2026 às 20h00\n' +
        '🏆  **Grande Final** — 11/07/2026 às 22h00'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '💰  **Premiação Total: R$ 2.000,00**\n\n' +
        '🥇  1º Lugar — R$ 1.000,00\n' +
        '🥈  2º Lugar — R$ 500,00\n' +
        '🥉  3º Lugar — R$ 300,00\n' +
        '4º Lugar — R$ 200,00'
      ))
  );

  // ── Como se inscrever ─────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(0x5865F2)
      .addTextDisplayComponents(txt('### 📋  COMO SE INSCREVER'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '**1.** Clique em **🎟️ Inscrever Time** abaixo\n' +
        '**2.** Um canal privado será criado para você\n' +
        '**3.** Clique em **📝 Preencher Ficha** e preencha o formulário\n' +
        '**4.** Aguarde a confirmação da staff'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '📌  **Dados necessários:**\n\n' +
        '▸  Nome do Clã · TAG · Line · Manager\n' +
        '▸  Nick In-Game e UID de cada jogador (até 5)'
      ))
  );

  // ── Regras ────────────────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(0xFF4444)
      .addTextDisplayComponents(txt('### ⚠️  ATENÇÃO'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '🚫  Inscrições com dados incorretos serão invalidadas\n' +
        '🚫  Jogadores banidos serão detectados automaticamente\n' +
        '🚫  Não abra mais de um ticket\n' +
        '✅  Máximo de **3 lines** por clã'
      ))
      .addSeparatorComponents(sep())
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_open')
            .setLabel('🎟️  Inscrever Time')
            .setStyle(ButtonStyle.Primary)
        )
      )
  );

  return {
    components: containers,
    flags: MessageFlags.IsComponentsV2,
  };
}

module.exports = { buildTicketPanel };
