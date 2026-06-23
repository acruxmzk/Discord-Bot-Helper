const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = (c) => new TextDisplayBuilder().setContent(c);

// ─── Histórico de resultados da Line Arasaka (mais recente → mais antigo) ─────
const RESULTADOS = [
  {
    data:       '20/06/2026',
    torneio:    'X-Treino Gueto',
    colocacao:  '🥇 1º lugar',
    kills:      156,
    pontos:     '1.660',
    obs:        null,
  },
  {
    data:       '20/06/2026',
    torneio:    'Torneio Baixada 13',
    colocacao:  '🥇 1º lugar',
    kills:      106,
    pontos:     '1.290',
    obs:        null,
  },
  {
    data:       '17/06/2026',
    torneio:    'XT-Kingslayers Eclipse',
    colocacao:  '🥇 1º lugar',
    kills:      106,
    pontos:     '1.155',
    obs:        null,
  },
  {
    data:       null,
    torneio:    'Xtreino Colíseu',
    colocacao:  '🥇 1º lugar',
    kills:      164,
    pontos:     '2.550',
    obs:        null,
  },
  {
    data:       null,
    torneio:    'X-Treino Frontier',
    colocacao:  '🥇 1º lugar',
    kills:      130,
    pontos:     '1.395',
    obs:        'Quinta · 22h',
  },
  {
    data:       null,
    torneio:    'X-Treino da Resistência',
    colocacao:  '🥇 1º lugar',
    kills:      155,
    pontos:     '825',
    obs:        'PT Kill 155 · PT Rank 50',
  },
  {
    data:       null,
    torneio:    'X-Treino Resistência (Winners)',
    colocacao:  '🥇 1º/25',
    kills:      60,
    pontos:     null,
    obs:        '2ª Queda',
  },
  {
    data:       null,
    torneio:    'Torneio Tribruxo (Queda 1)',
    colocacao:  '🥇 1º/25',
    kills:      61,
    pontos:     null,
    obs:        '1ª Queda',
  },
  {
    data:       null,
    torneio:    'Torneio Tribruxo (Queda 2)',
    colocacao:  '🥇 1º/23',
    kills:      49,
    pontos:     null,
    obs:        '3ª Queda',
  },
];

function buildContainers() {
  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  const header = new ContainerBuilder()
    .setAccentColor(0xFFD700)
    .addTextDisplayComponents(txt(
      `## ⚔️ OBLIVION · LINE ARASAKA\n` +
      `### 🏆 Histórico de Resultados em X-Treinos\n` +
      `-# Organizado por data · do mais recente ao mais antigo`
    ));

  // ── Resultados com data ────────────────────────────────────────────────────
  const comData = RESULTADOS.filter(r => r.data);
  const semData = RESULTADOS.filter(r => !r.data);

  const linhasComData = comData.map(r => {
    const pontos = r.pontos ? `**${r.pontos} pts**` : '—';
    const obs    = r.obs ? `  ·  _${r.obs}_` : '';
    return (
      `📅 **${r.data}** · ${r.torneio}\n` +
      `> ${r.colocacao}  ·  💀 ${r.kills} kills  ·  ${pontos}${obs}`
    );
  }).join('\n\n');

  const blocoComData = new ContainerBuilder()
    .setAccentColor(0x00C851)
    .addTextDisplayComponents(txt('### 📆 Com Data Confirmada'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(linhasComData));

  // ── Resultados sem data ────────────────────────────────────────────────────
  const linhasSemData = semData.map(r => {
    const pontos = r.pontos ? `**${r.pontos} pts**` : '—';
    const obs    = r.obs ? `  ·  _${r.obs}_` : '';
    return (
      `🏟️ **${r.torneio}**\n` +
      `> ${r.colocacao}  ·  💀 ${r.kills} kills  ·  ${pontos}${obs}`
    );
  }).join('\n\n');

  const blocoSemData = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(txt('### 🗂️ Sem Data Registrada'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(linhasSemData));

  // ── Resumo geral ───────────────────────────────────────────────────────────
  const totalTorneios = RESULTADOS.length;
  const totalKills    = RESULTADOS.reduce((s, r) => s + r.kills, 0);
  const vitorias      = RESULTADOS.filter(r => r.colocacao.includes('1º')).length;

  const resumo = new ContainerBuilder()
    .setAccentColor(0xFF8C00)
    .addTextDisplayComponents(txt(
      `### 📊 Resumo Geral\n` +
      `> 🏟️ **Torneios registrados:** ${totalTorneios}\n` +
      `> 🥇 **1º lugares:** ${vitorias}/${totalTorneios}\n` +
      `> 💀 **Total de kills:** ${totalKills.toLocaleString('pt-BR')}`
    ))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt(`-# ⚔️ Oblivion League · Line Arasaka`));

  return [header, blocoComData, blocoSemData, resumo];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('arasaka')
    .setDescription('Histórico de resultados da Line Arasaka em X-Treinos')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(o =>
      o.setName('canal')
        .setDescription('Publicar neste canal (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const canal = interaction.options.getChannel('canal');
    const containers = buildContainers();

    if (canal) {
      await canal.send({ components: containers, flags: MessageFlags.IsComponentsV2 });
      await interaction.reply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0x00C851)
            .addTextDisplayComponents(txt(
              `### ✅ Tabela Arasaka publicada\n-# Resultados postados em <#${canal.id}>.`
            )),
        ],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      components: containers,
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
