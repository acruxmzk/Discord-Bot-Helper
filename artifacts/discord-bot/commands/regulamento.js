const {
  SlashCommandBuilder,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ChannelType,
} = require('discord.js');

function buildRegulamentoContainers() {
  const sep = () =>
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);

  const sepLg = () =>
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);

  // ── Container 1: Apresentação + Cronograma + Premiação ─────────────────
  const c1 = new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# 🌐  OBLIVION LEAGUE')
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('-# Regulamento Oficial do Campeonato')
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '### 📅  Cronograma\n' +
        '🗓️  **08/07** — 1ª Classificatória\n' +
        '🗓️  **09/07** — 2ª Classificatória\n' +
        '🏆  **11/07** — Grande Final'
      )
    )
    .addSeparatorComponents(sepLg())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '### 🕒  Horários\n' +
        '🎯  Classificatórias — **20h00**\n' +
        '🏆  Grande Final — **22h00**'
      )
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '### 💰  Premiação\n' +
        '🥇  1º Lugar — **R$ 1.000,00**\n' +
        '🥈  2º Lugar — **R$ 500,00**\n' +
        '🥉  3º Lugar — **R$ 250,00**\n' +
        '🎖️  4º Lugar — **R$ 200,00**\n' +
        '🏅  MVP — **R$ 50,00**\n' +
        '-# 💵 Premiação Total: R$ 2.000,00'
      )
    );

  // ── Container 2: Configurações + Formato ───────────────────────────────
  const c2 = new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '### 🎮  Configurações\n' +
        '👥  Modo: **Squad** · ❤️  Reanimação Automática · ♾️  Munição Infinita\n' +
        '🗺️  Mapas: **Isolated** e **Blackout**'
      )
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '### ⚡  Formato\n' +
        '🎯  **Classificatórias** — 3 Quedas\n' +
        '🏆  **Final** — 4 Quedas\n' +
        '> 2 com habilidades · 2 sem habilidades'
      )
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '### 📜  Regras Gerais\n' +
        '🏷️  Todos os membros deverão usar a mesma **TAG**\n' +
        '📸  Denúncias apenas com provas\n' +
        '👤  Jogadores não cadastrados não poderão participar\n' +
        '🚫  Equipes com jogadores não inscritos poderão ser desclassificadas\n' +
        '⚔️  Permitido até **3 lines** por clã'
      )
    );

  // ── Container 3: Proibições ────────────────────────────────────────────
  const c3 = new ContainerBuilder()
    .setAccentColor(0xFF4444)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### 🚫  Proibições')
    )
    .addSeparatorComponents(sepLg())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '**Geral**\n' +
        '`💻` Trapaças  `🖥️` Emuladores  `📱` Mobiladores  `🌐` VPN\n' +
        '`🚗` Atropelar  `📢` Call para todos  `😡` Comportamentos antidesportivos  `💬` Brigas no chat'
      )
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '**Armas Proibidas**\n' +
        '`🎯` Munições especiais de snipers  `💣` Bazuca  `💥` Thumper\n' +
        '`⚡` Tempestade  `🎖️` Aniquilador  `🔫` Máquina de Guerra  `🔥` Purificador\n' +
        '-# ℹ️ FHJ apenas contra veículos.'
      )
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '**Habilidades Proibidas**\n' +
        '`❌` Desperado  `❌` Onda de Choque  `❌` Desorientação  `❌` Bombado\n' +
        '`❌` Incendiário  `❌` Todas as torretas  `❌` Ataque de Dispersão'
      )
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '**Veículos Proibidos**\n' +
        '`🚚` Caminhão  `🛡️` Tanque  `✈️` Jato  `🚀` Bike Voadora'
      )
    );

  // ── Container 4: Verificação + Discord + Penalidades ──────────────────
  const c4 = new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '### 🔎  Verificação\n' +
        '🎥  Vídeos obrigatórios de **todas as quedas**\n' +
        '📋  Requisitos: barra de notificações · horário · apps abertos · HUD\n' +
        '🎞️  **4 vídeos** por jogador · **16 vídeos** por equipe\n' +
        '⏰  Prazo: até **02h00** da manhã após o campeonato\n' +
        '-# A staff pode solicitar abertura de tela a qualquer momento. Recusa pode resultar em desclassificação.'
      )
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '### 🎙️  Discord\n' +
        '👥  Todos os jogadores devem estar presentes no Discord antes do início\n' +
        '🔍  Presença poderá ser usada para conferência de lineup e verificações\n' +
        '⚠️  Equipes ausentes poderão sofrer punições ou desclassificação'
      )
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '### ❗  Penalidades\n' +
        '➖  Armas/habilidades proibidas → **-50 pontos**\n' +
        '🚫  Comportamento antidesportivo → **Expulsão e possível banimento**\n' +
        '🌐  Uso de VPN → **Expulsão imediata**\n' +
        '💻  Uso de trapaças → **Banimento permanente**\n' +
        '💬  Brigas no chat → 1ª Advertência · 2ª: **-50 pontos**\n' +
        '🚗  Atropelar / Call para Todos → **Queda zerada**'
      )
    );

  // ── Container 5: Pontuação ─────────────────────────────────────────────
  const c5 = new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### 🏆  Pontuação')
    )
    .addSeparatorComponents(sepLg())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '**🎯  Sem Habilidades**\n' +
        '① 15ᵖᵗˢ  ② 13ᵖᵗˢ  ③ 11ᵖᵗˢ  ④ 10ᵖᵗˢ  ⑤ 9ᵖᵗˢ\n' +
        '⑥ 8ᵖᵗˢ  ⑦ 7ᵖᵗˢ  ⑧ 6ᵖᵗˢ  ⑨ 5ᵖᵗˢ  ⑩ 4ᵖᵗˢ\n' +
        '🩸  Kill = 1ᵖᵗˢ'
      )
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '**⚡  Com Habilidades**\n' +
        '① 15ᵖᵗˢ  ② 13ᵖᵗˢ  ③ 11ᵖᵗˢ  ④ 10ᵖᵗˢ  ⑤ 9ᵖᵗˢ  ⑥ 8ᵖᵗˢ\n' +
        '🩸  Kill = 1ᵖᵗˢ'
      )
    )
    .addSeparatorComponents(sepLg())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '-# Oblivion League • Regulamento Oficial'
      )
    );

  return [c1, c2, c3, c4, c5];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regulamento')
    .setDescription('Exibe o regulamento completo da Oblivion League')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal onde postar o regulamento (opcional — padrão: aqui)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetChannel = interaction.options.getChannel('canal') ?? interaction.channel;
    const containers = buildRegulamentoContainers();

    for (const container of containers) {
      await targetChannel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const where = targetChannel.id === interaction.channelId
      ? 'neste canal'
      : `em ${targetChannel}`;

    await interaction.editReply({ content: `✅ Regulamento postado ${where}.` });
  },
};
