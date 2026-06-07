const {
  SlashCommandBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ChannelType,
} = require('discord.js');

const sep  = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap  = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt  = (s) => new TextDisplayBuilder().setContent(s);

function buildRegulamentoContainers() {

  // ── 1. Cabeçalho + Cronograma + Premiação ─────────────────────────────
  const c1 = new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(txt('# OBLIVION LEAGUE'))
    .addTextDisplayComponents(txt('-# Regulamento Oficial'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '### Cronograma\n' +
      '08/07 · 1ª Classificatória\n' +
      '09/07 · 2ª Classificatória\n' +
      '11/07 · Grande Final'
    ))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt(
      '### Horários\n' +
      'Classificatórias — **20h00**\n' +
      'Grande Final — **22h00**'
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '### Premiação\n' +
      '1° — R$ 1.000,00\n' +
      '2° — R$ 500,00\n' +
      '3° — R$ 250,00\n' +
      '4° — R$ 200,00\n' +
      'MVP — R$ 50,00\n' +
      '-# Total: R$ 2.000,00'
    ));

  // ── 2. Configurações + Formato + Regras Gerais ────────────────────────
  const c2 = new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(txt(
      '### Configurações\n' +
      'Modo Squad · Reanimação Automática · Munição Infinita\n' +
      'Mapas: **Isolated** e **Blackout**'
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '### Formato\n' +
      'Classificatórias — 3 quedas\n' +
      'Final — 4 quedas (2 com habilidades · 2 sem habilidades)'
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '### Regras Gerais\n' +
      '· Todos os membros devem usar a mesma TAG\n' +
      '· Denúncias apenas com provas\n' +
      '· Jogadores não cadastrados não podem participar\n' +
      '· Equipes com jogadores não inscritos podem ser desclassificadas\n' +
      '· Permitido até 3 lines por clã'
    ));

  // ── 3. Proibições ─────────────────────────────────────────────────────
  const c3 = new ContainerBuilder()
    .setAccentColor(0xFF4444)
    .addTextDisplayComponents(txt('### Proibições'))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt(
      '**Geral**\n' +
      'Trapaças · Emuladores · Mobiladores · VPN · Atropelar · Call para todos · Brigas no chat'
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '**Armas**\n' +
      'Munições especiais de snipers · Bazuca · Thumper · Tempestade · Aniquilador · Máquina de Guerra · Purificador\n' +
      '-# FHJ permitido apenas contra veículos.'
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '**Habilidades**\n' +
      'Desperado · Onda de Choque · Desorientação · Bombado · Incendiário · Torretas · Ataque de Dispersão'
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '**Veículos**\n' +
      'Caminhão · Tanque · Jato · Bike Voadora'
    ));

  // ── 4. Verificação + Discord + Penalidades ────────────────────────────
  const c4 = new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(txt(
      '### Verificação\n' +
      'Vídeos obrigatórios de todas as quedas.\n' +
      'Mostrar: barra de notificações · horário · apps abertos · HUD\n' +
      '4 vídeos por jogador — 16 por equipe\n' +
      'Prazo: até **02h00** após o campeonato\n' +
      '-# A staff pode solicitar tela a qualquer momento. Recusa = desclassificação.'
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '### Discord\n' +
      'Todos os jogadores devem estar presentes antes do início.\n' +
      'Ausência pode resultar em punição ou desclassificação.'
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '### Penalidades\n' +
      'Armas/habilidades proibidas — **−50 pts**\n' +
      'Comportamento antidesportivo — **Expulsão**\n' +
      'VPN — **Expulsão imediata**\n' +
      'Trapaças — **Banimento permanente**\n' +
      'Brigas no chat — Advertência → **−50 pts**\n' +
      'Atropelar / Call para Todos — **Queda zerada**'
    ));

  // ── 5. Pontuação ──────────────────────────────────────────────────────
  const c5 = new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(txt('### Pontuação'))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt(
      '**Sem Habilidades**\n' +
      '```\n' +
      ' 1°  15    6°   8\n' +
      ' 2°  13    7°   7\n' +
      ' 3°  11    8°   6\n' +
      ' 4°  10    9°   5\n' +
      ' 5°   9   10°   4\n' +
      'Kill   1\n' +
      '```'
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '**Com Habilidades**\n' +
      '```\n' +
      ' 1°  15    4°  10\n' +
      ' 2°  13    5°   9\n' +
      ' 3°  11    6°   8\n' +
      'Kill   1\n' +
      '```'
    ))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt('-# Oblivion League · Regulamento Oficial'));

  return [c1, c2, c3, c4, c5];
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
