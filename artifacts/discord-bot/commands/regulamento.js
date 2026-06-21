const {
  SlashCommandBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ChannelType,
} = require('discord.js');

const regulamentoDB = require('../utils/regulamentoDB');

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = (s) => new TextDisplayBuilder().setContent(s);

const DEFAULTS = {
  data_class1: '20/07/2026',
  data_class2: '21/07/2026',
  data_final:  '23/07/2026',
  link_forms:  '',
};

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

function buildRegulamentoContainers(cfg = {}) {
  const c1        = cfg.data_class1 ?? DEFAULTS.data_class1;
  const c2        = cfg.data_class2 ?? DEFAULTS.data_class2;
  const final     = cfg.data_final  ?? DEFAULTS.data_final;
  const linkForms = cfg.link_forms  ?? DEFAULTS.link_forms;

  const containers = [];

  // ── 1. Header ─────────────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.brand)
      .addTextDisplayComponents(txt('# 🌐  OBLIVION LEAGUE'))
      .addTextDisplayComponents(txt('-# Regulamento Oficial · Temporada 2026'))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        `📅  Classificatórias: **${c1.replace('/2026', '')}** e **${c2}**\n` +
        `🏆  Grande Final: **${final}**\n` +
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
        `🗓️  **${c1} — 1ª Classificatória**\n` +
        '> 🕒 20h00  ·  3 quedas'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        `🗓️  **${c2} — 2ª Classificatória**\n` +
        '> 🕒 20h00  ·  3 quedas'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        `🏆  **${final} — Grande Final**\n` +
        '> 🕒 22h00  ·  4 quedas\n' +
        '> 2 no Isolated  ·  2 no Blackout\n' +
        '> 2 com habilidades  ·  2 sem habilidades'
      ))
  );

  // ── 3. Classificatórias ───────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.score2)
      .addTextDisplayComponents(txt('### 🏆  CLASSIFICATÓRIAS'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '📋  **1ª Classificatória** — as 12 melhores equipes avançam para a Grande Final.\n\n' +
        '📋  **2ª Classificatória** — as 12 melhores equipes avançam para a Grande Final.\n\n' +
        '👥  **Total de classificados:** 24 equipes.\n\n' +
        '📖  As Classificatórias seguirão o modelo e regulamento oficial dos torneios XT.'
      ))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt('-# 🌐  Oblivion League · Regulamento Oficial · 2026'))
  );

  // ── 4. Grande Final — Separador ───────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.brand)
      .addTextDisplayComponents(txt(`### 🏆  GRANDE FINAL — ${final} às 22h00`))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt('👥  **24 equipes classificadas**'))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt('-# 📋  As regras a seguir se aplicam à Grande Final.'))
  );

  // ── 5. Premiação ──────────────────────────────────────────────────────────
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

  // ── 6. Configurações e Formato ────────────────────────────────────────────
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
      .addSeparatorComponents(sep())
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
        '🏷️  Todos os jogadores devem utilizar a TAG oficial da equipe. São permitidos até **2 jogadores sem TAG** por squad.\n' +
        '📸  Denúncias serão analisadas somente mediante apresentação de provas\n' +
        '👤  Somente jogadores devidamente inscritos estão autorizados a competir\n' +
        '🚫  A escalação de jogadores não inscritos sujeita a equipe à desclassificação imediata\n' +
        '⚔️  Cada clã poderá inscrever até **4 lines** no campeonato'
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
        '⚠️  A verificação é obrigatória para todos os jogadores e equipes, sem exceção.\n' +
        '🖥️  A staff poderá solicitar compartilhamento de tela a qualquer momento.\n' +
        '-# 🚫  A recusa implica desclassificação imediata e possível banimento.'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '📹  A organização poderá solicitar handcam ou outros procedimentos de verificação a qualquer jogador, em qualquer fase do campeonato.\n\n' +
        '⚠️  O descumprimento das solicitações da organização resultará em penalidades, desclassificação ou banimento da competição.'
      ))
  );

  // ── 10. Discord ───────────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.verify)
      .addTextDisplayComponents(txt('### 🎙️  DISCORD'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '👥  Todos os jogadores deverão permanecer no Discord oficial da competição durante toda a realização do campeonato.\n\n' +
        '🔍  A organização poderá realizar conferências de lineup, verificações e procedimentos administrativos a qualquer momento.\n\n' +
        '⚠️  A ausência de jogadores no Discord oficial poderá resultar em advertências, penalidades ou desclassificação da equipe.'
      ))
  );

  // ── 11. Penalidades ───────────────────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.penalty)
      .addTextDisplayComponents(txt('### ❗  PENALIDADES'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '🔫  Uso de arma ou habilidade proibida\n' +
        '> ➖  **−50 pontos**'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '😡  Comportamento antidesportivo\n' +
        '> 🚫  **Expulsão do campeonato** (após análise da staff)'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '🌐  Uso de VPN\n' +
        '> 🚫  **Expulsão imediata** (sem análise prévia)'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '💻  Uso de programas de trapaça\n' +
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
        '🚗  Atropelar\n' +
        '> ❌  **Queda zerada**'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '📢  Call para Todos\n' +
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

  // ── 13. Pontuação — Com Habilidades ───────────────────────────────────────
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
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt('-# 🌐  Oblivion League · Regulamento Oficial · 2026'))
  );

  // ── 14. Observações Complementares ────────────────────────────────────────
  containers.push(
    new ContainerBuilder()
      .setAccentColor(COLOR.penalty)
      .addTextDisplayComponents(txt('### 📌  OBSERVAÇÕES COMPLEMENTARES'))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '**1.**  O envio de prints dos perfis obrigatórios durante o campeonato não será exigido. A confirmação será feita ao término da competição. Caso algum player da line não esteja seguindo os perfis obrigatórios, a premiação será retida.\n\n' +
        '**2.**  Todos os integrantes do squad devem estar presentes no Discord oficial da Oblivion League. A capitã é responsável pela entrada, organização e permanência da equipe no servidor.\n\n' +
        '**3.**  O nick no Discord deve ser idêntico ao nick utilizado no jogo. A manager é responsável por garantir isso.\n\n' +
        '**4.**  Todas as demais regras permanecem vigentes e devem ser cumpridas integralmente.'
      ))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '-# ⚠️  Em caso de suspeita de irregularidade, a Oblivion League se reserva o direito de convocar a equipe para verificação. As regras de permanência no Discord e de controle de acesso visam garantir a integridade da competição, impedindo a participação de jogadores banidos, irregulares ou não autorizados.'
      ))
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
    )
    .addBooleanOption(option =>
      option
        .setName('atualizar')
        .setDescription('Apaga o regulamento anterior e posta o atualizado')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetChannel = interaction.options.getChannel('canal') ?? interaction.channel;
    const atualizar     = interaction.options.getBoolean('atualizar') ?? false;

    // ── Apagar mensagens anteriores ───────────────────────────────────────────
    if (atualizar) {
      const saved = await regulamentoDB.getMessageIds();
      const ch    = (saved?.channelId && interaction.guild.channels.cache.get(saved.channelId)) ?? targetChannel;

      if (saved?.messageIds?.length) {
        // IDs rastreados — apaga cada um diretamente
        for (const msgId of saved.messageIds) {
          try {
            const msg = await ch.messages.fetch(msgId);
            await msg.delete();
          } catch {
            // mensagem já apagada ou inacessível — ignorar
          }
        }
      } else {
        // Fallback: varrer o canal e apagar todas as mensagens do bot
        try {
          const fetched = await targetChannel.messages.fetch({ limit: 100 });
          const botMsgs = fetched.filter(m => m.author.id === interaction.client.user.id);
          for (const msg of botMsgs.values()) {
            try { await msg.delete(); } catch { /* ignorar */ }
          }
        } catch {
          // sem permissão ou canal inacessível
        }
      }
    }

    // ── Postar regulamento atualizado ─────────────────────────────────────────
    const allRows = await regulamentoDB.getAll();
    const cfg     = Object.fromEntries(Object.entries(allRows).map(([k, row]) => [k, row.valor]));
    const containers = buildRegulamentoContainers(cfg);

    const newIds = [];
    for (const container of containers) {
      const msg = await targetChannel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
      newIds.push(msg.id);
    }

    await regulamentoDB.saveMessageIds(targetChannel.id, newIds);

    const where  = targetChannel.id === interaction.channelId ? 'neste canal' : `em ${targetChannel}`;
    const status = atualizar ? '🔄 Regulamento atualizado' : '✅ Regulamento postado';
    await interaction.editReply({ content: `${status} ${where}.` });
  },
};
