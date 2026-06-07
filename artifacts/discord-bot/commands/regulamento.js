const {
  SlashCommandBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ChannelType,
} = require('discord.js');

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = (s) => new TextDisplayBuilder().setContent(s);

const COLOR = {
  brand:     0xFFA500,
  schedule:  0x5865F2,
  prize:     0xFFD700,
  gameplay:  0x00B8D4,
  rules:     0x57F287,
  forbidden: 0xFF4444,
  verify:    0x9B59B6,
  penalty:   0xFF6B35,
  score1:    0x00CED1,
  score2:    0x7289DA,
};

function buildRegulamentoContainers() {
  const containers = [];

  // ── 1. Header ─────────────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.brand)
      .addTextDisplayComponents(txt('# 🌐  OBLIVION LEAGUE'))
      .addTextDisplayComponents(txt('-# Regulamento Oficial · Temporada 2026'))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '📅  Classificatórias: **08/07** e **09/07/2026**\n' +
        '🏆  Grande Final: **11/07/2026**\n' +
        '💰  Premiação Total: **R$ 2.000,00**\n' +
        '👥  Modo: **Squad**'
      ))
  );

  // ── 2. Cronograma ─────────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.schedule)
      .addTextDisplayComponents(txt('### 📅  CRONOGRAMA'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '🗓️  **08/07/2026 — 1ª Classificatória**\n' +
        '> 🕒 20h00  ·  3 quedas'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '🗓️  **09/07/2026 — 2ª Classificatória**\n' +
        '> 🕒 20h00  ·  3 quedas'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '🏆  **11/07/2026 — Grande Final**\n' +
        '> 🕒 22h00  ·  4 quedas\n' +
        '> 2 no Isolated  ·  2 no Blackout\n' +
        '> 2 com habilidades  ·  2 sem habilidades'
      ))
  );

  // ── 3. Premiação ──────────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.prize)
      .addTextDisplayComponents(txt('### 💰  PREMIAÇÃO'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '🥇  **1º Lugar** — R$ 1.000,00\n' +
        '🥈  **2º Lugar** — R$ 500,00\n' +
        '🥉  **3º Lugar** — R$ 250,00\n' +
        '🎖️  **4º Lugar** — R$ 200,00\n' +
        '🏅  **MVP** — R$ 50,00'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt('-# 💵  Premiação Total: R$ 2.000,00'))
  );

  // ── 4. Configurações ──────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.gameplay)
      .addTextDisplayComponents(txt('### 🎮  CONFIGURAÇÕES'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '👥  Modo: **Squad**\n' +
        '❤️  Reanimação Automática\n' +
        '♾️  Munição Infinita'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '🗺️  **Mapas**\n' +
        '🏝️  Isolated  ·  🌆  Blackout'
      ))
  );

  // ── 5. Formato ────────────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.gameplay)
      .addTextDisplayComponents(txt('### ⚡  FORMATO'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '🎯  **Classificatórias** — 3 quedas por rodada\n' +
        '🏆  **Grande Final** — 4 quedas\n' +
        '> 2 quedas com habilidades\n' +
        '> 2 quedas sem habilidades'
      ))
  );

  // ── 6. Regras Gerais ──────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.rules)
      .addTextDisplayComponents(txt('### 📜  REGRAS GERAIS'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '🏷️  Todos os jogadores deverão utilizar a mesma **TAG** da equipe\n' +
        '📸  Denúncias aceitas apenas mediante provas\n' +
        '👤  Jogadores não cadastrados não poderão participar\n' +
        '🚫  Equipes com jogadores não inscritos podem ser desclassificadas\n' +
        '⚔️  Permitido até **3 lines** por clã'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt('### 📌  REGRAS COMPLEMENTARES'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '🆔  Alterações de UID permitidas até **1 dia antes** da Grande Final\n' +
        '📅  Prazo final: **10/07/2026 às 23h59**\n' +
        '🚫  Após esse prazo nenhuma alteração será aceita\n' +
        '📨  Solicitações via canais oficiais da organização'
      ))
  );

  // ── 7. Proibições — Comportamentos ────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.forbidden)
      .addTextDisplayComponents(txt('### 🚫  PROIBIÇÕES'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '💻  Programas de trapaça\n' +
        '🖥️  Emuladores\n' +
        '📱  Mobiladores\n' +
        '🌐  VPN\n' +
        '🚗  Atropelar\n' +
        '📢  Call para todos\n' +
        '😡  Comportamentos antidesportivos\n' +
        '💬  Brigas no chat'
      ))
  );

  // ── 8. Proibições — Armas, Habilidades e Veículos ─────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.forbidden)
      .addTextDisplayComponents(txt('**🔫  Armas Proibidas**'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '🎯  Munições especiais de sniper\n' +
        '💣  Bazuca\n' +
        '💥  Thumper\n' +
        '⚡  Tempestade\n' +
        '🎖️  Aniquilador\n' +
        '🔫  Máquina de Guerra\n' +
        '🔥  Purificador\n' +
        '-# ℹ️  FHJ permitido apenas contra veículos.'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt('**🚫  Habilidades Proibidas**'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '❌  Desperado\n' +
        '❌  Onda de Choque\n' +
        '❌  Desorientação\n' +
        '❌  Bombado\n' +
        '❌  Incendiário\n' +
        '❌  Todas as torretas\n' +
        '❌  Ataque de Dispersão'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt('**🚗  Veículos Proibidos**'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '🚚  Caminhão  ·  🛡️  Tanque  ·  ✈️  Jato  ·  🚀  Bike Voadora'
      ))
  );

  // ── 9. Verificação ────────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.verify)
      .addTextDisplayComponents(txt('### 🔎  VERIFICAÇÃO'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '🎥  Vídeos obrigatórios de **todas** as quedas\n' +
        '📋  **Requisitos do vídeo:**\n' +
        '> Mostrar barra de notificações\n' +
        '> Mostrar horário\n' +
        '> Mostrar aplicativos abertos\n' +
        '> Mostrar HUD'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '🎞️  **4 vídeos** por jogador  ·  **16 vídeos** por equipe\n' +
        '⏰  Prazo: até **02h00** da manhã após o campeonato'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '⚠️  Nenhum jogador ou equipe estará isento de verificação\n' +
        '🖥️  A staff pode solicitar abertura de tela a qualquer momento\n' +
        '-# 🚫  Recusa = desclassificação e possível banimento.'
      ))
  );

  // ── 10. Discord ───────────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.verify)
      .addTextDisplayComponents(txt('### 🎙️  DISCORD'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '👥  Todos os jogadores devem estar presentes no Discord antes do início\n' +
        '🔍  Presença usada para conferência de lineup e verificações\n' +
        '⚠️  Equipes ausentes podem sofrer punições ou desclassificação'
      ))
  );

  // ── 11. Penalidades ───────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.penalty)
      .addTextDisplayComponents(txt('### ❗  PENALIDADES'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '🔫  Armas ou habilidades proibidas\n' +
        '> ➖  **−50 pontos**'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '😡  Comportamento antidesportivo\n' +
        '> 🚫  **Expulsão do campeonato**'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '🌐  Uso de VPN\n' +
        '> 🚫  **Expulsão imediata**'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '💻  Uso de trapaças\n' +
        '> ⛔  **Banimento permanente**'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '💬  Brigas no chat\n' +
        '> 1ª ocorrência → ⚠️  Advertência\n' +
        '> 2ª ocorrência → ➖  **−50 pontos**'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '🚗  Atropelar ou Call para Todos\n' +
        '> ❌  **Queda zerada**'
      ))
  );

  // ── 12. Pontuação — Sem Habilidades ───────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.score1)
      .addTextDisplayComponents(txt('### 🏆  PONTUAÇÃO'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt('### 🎯  SEM HABILIDADES'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '🥇  **1º Lugar** → 15 pts\n' +
        '🥈  **2º Lugar** → 13 pts\n' +
        '🥉  **3º Lugar** → 11 pts\n' +
        '▫️  **4º Lugar** → 10 pts\n' +
        '▫️  **5º Lugar** → 9 pts\n' +
        '▫️  **6º Lugar** → 8 pts\n' +
        '▫️  **7º Lugar** → 7 pts\n' +
        '▫️  **8º Lugar** → 6 pts\n' +
        '▫️  **9º Lugar** → 5 pts\n' +
        '▫️  **10º Lugar** → 4 pts'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt('🩸  Kill → **+1 ponto**'))
  );

  // ── 13. Pontuação — Com Habilidades + Classificação ───────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.score2)
      .addTextDisplayComponents(txt('### ⚡  COM HABILIDADES'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '🥇  **1º Lugar** → 15 pts\n' +
        '🥈  **2º Lugar** → 13 pts\n' +
        '🥉  **3º Lugar** → 11 pts\n' +
        '▫️  **4º Lugar** → 10 pts\n' +
        '▫️  **5º Lugar** → 9 pts\n' +
        '▫️  **6º Lugar** → 8 pts\n' +
        '▫️  **7º Lugar** → 7 pts\n' +
        '▫️  **8º Lugar** → 6 pts\n' +
        '▫️  **9º Lugar** → 5 pts\n' +
        '▫️  **10º Lugar** → 4 pts'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt('🩸  Kill → **+2 pontos**'))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '### 📊  CLASSIFICAÇÃO\n' +
        '-# Como as equipes são ranqueadas'
      ))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '📈  Classificação pelo padrão dos torneios XT\n' +
        '🎯  Soma de colocação + eliminações define o ranking final\n' +
        '📋  Pontuação acumulada ao longo de toda a competição'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '📊  A classificação das Classificatórias seguirá o padrão oficial utilizado nos torneios XT.\n\n' +
        '📅  **08/07/2026**\n' +
        '🏆  As 12 melhores equipes avançam para a Grande Final.\n\n' +
        '📅  **09/07/2026**\n' +
        '🏆  As 12 melhores equipes avançam para a Grande Final.\n\n' +
        '🏆  Total de classificados para a Grande Final: **24 equipes**.'
      ))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt('-# 🌐  Oblivion League · Regulamento Oficial · 2026'))
  );

  return containers;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regulamento')
    .setDescription('Exibe o regulamento completo da Oblivion League')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal onde postar (padrão: aqui)')
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

    const where = targetChannel.id === interaction.channelId ? 'neste canal' : `em ${targetChannel}`;
    await interaction.editReply({ content: `✅ Regulamento postado ${where}.` });
  },
};
