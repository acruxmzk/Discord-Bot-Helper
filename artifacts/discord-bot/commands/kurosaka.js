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

// ─── Dados dos torneios (mais recente → mais antigo) ──────────────────────────
// data: string DD/MM/YYYY ou null | pontos: number ou null
const RESULTADOS = [
];

// ─── Montar tabela monospace ──────────────────────────────────────────────────
function pad(str, len, right = false) {
  const s = String(str ?? '—');
  return right ? s.padStart(len) : s.padEnd(len);
}

function buildTabela() {
  if (RESULTADOS.length === 0) {
    return '```\nNenhum resultado cadastrado ainda.\n```';
  }

  const header  = `${'#'.padEnd(2)}  ${'TORNEIO'.padEnd(26)}  ${'DATA'.padEnd(10)}  ${'KILLS'.padStart(5)}  ${'PTS'.padStart(6)}`;
  const divider = '─'.repeat(header.length);

  const linhas = RESULTADOS.map((r, i) => {
    const n    = pad(i + 1, 2);
    const nome = pad(r.torneio, 26);
    const data = pad(r.data ?? 's/ data', 10);
    const k    = pad(r.kills, 5, true);
    const pts  = r.pontos != null
      ? pad(r.pontos.toLocaleString('pt-BR'), 6, true)
      : pad('—', 6, true);
    return `${n}  ${nome}  ${data}  ${k}  ${pts}`;
  });

  return `\`\`\`\n${header}\n${divider}\n${linhas.join('\n')}\n\`\`\``;
}

// ─── Montar containers ────────────────────────────────────────────────────────
function buildContainers() {
  const totalKills = RESULTADOS.reduce((s, r) => s + r.kills, 0);
  const comPontos  = RESULTADOS.filter(r => r.pontos != null);
  const totalPts   = comPontos.reduce((s, r) => s + r.pontos, 0);
  const vitorias   = RESULTADOS.filter(r => r.lugar === 1).length;

  // ── 1. Cabeçalho ────────────────────────────────────────────────────────────
  const cabecalho = new ContainerBuilder()
    .setAccentColor(0xFFD700)
    .addTextDisplayComponents(txt(
      `## ⚔️ OBLIVION — LINE KUROSAKA\n` +
      `### 📋 Tabela de Resultados · X-Treinos & Torneios\n` +
      `-# Organizado por data — do mais recente ao mais antigo`
    ));

  // ── 2. Tabela principal ──────────────────────────────────────────────────────
  const tabela = new ContainerBuilder()
    .setAccentColor(0x00C851)
    .addTextDisplayComponents(txt('### 🏆 Histórico Completo'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(buildTabela()))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      `-# 🟡 Amarelo = com data confirmada  ·  s/ data = data não informada`
    ));

  // ── 3. Destaques (top kills) ─────────────────────────────────────────────────
  const sorted    = [...RESULTADOS].sort((a, b) => b.kills - a.kills).slice(0, 3);
  const medals    = ['🥇', '🥈', '🥉'];
  const topLinhas = sorted.length > 0
    ? sorted.map((r, i) =>
        `${medals[i]} **${r.kills} kills** — ${r.torneio}${r.data ? ` *(${r.data})*` : ''}`
      ).join('\n')
    : '*Nenhum resultado registrado ainda.*';

  const destaques = new ContainerBuilder()
    .setAccentColor(0xFF8C00)
    .addTextDisplayComponents(txt('### 💀 Top 3 Performances'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(topLinhas));

  // ── 4. Resumo geral ──────────────────────────────────────────────────────────
  const winRate = RESULTADOS.length > 0
    ? `${vitorias}/${RESULTADOS.length}  *(${Math.round((vitorias / RESULTADOS.length) * 100)}%)*`
    : '—';

  const resumo = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(txt('### 📊 Resumo Geral'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      `> 🏟️ **Torneios:**  ${RESULTADOS.length || '—'}\n` +
      `> 🥇 **Vitórias:**  ${winRate}\n` +
      `> 💀 **Total kills:**  ${totalKills > 0 ? totalKills.toLocaleString('pt-BR') : '—'}\n` +
      `> 📈 **Kills / torneio:**  ${RESULTADOS.length > 0 ? (totalKills / RESULTADOS.length).toFixed(1) : '—'}\n` +
      `> 🎯 **Pontos somados:**  ${totalPts > 0 ? `${totalPts.toLocaleString('pt-BR')} pts  *(${comPontos.length} torneios c/ dados)*` : '—'}`
    ))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt(
      `-# ⚔️ Oblivion League · Line Kurosaka · Atualizado em ${new Date().toLocaleDateString('pt-BR')}`
    ));

  return [cabecalho, tabela, destaques, resumo];
}

// ─── Comando ──────────────────────────────────────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName('kurosaka')
    .setDescription('Tabela de resultados da Line Kurosaka em X-Treinos e torneios')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(o =>
      o.setName('canal')
        .setDescription('Publicar neste canal (opcional — fica público)')
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
              `### ✅ Tabela publicada em <#${canal.id}>\n` +
              `-# ${RESULTADOS.length} resultado${RESULTADOS.length !== 1 ? 's' : ''} · Line Kurosaka · Oblivion League`
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
