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
const { getAll }              = require('../utils/movieDB');
const { buildPanelContainer } = require('../utils/buildPanelContainer');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

function fmtDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  const m = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${d.getDate()} ${m[d.getMonth()]}`;
}

function stars(note) {
  if (note === null) return '';
  const full = Math.round(parseFloat(note) / 2);
  return '★'.repeat(Math.max(0, full)) + '☆'.repeat(Math.max(0, 5 - full));
}

function noteLabel(note) {
  if (note === null) return '';
  const n = parseFloat(note);
  if (n >= 9)   return '🏆';
  if (n >= 7.5) return '🔥';
  if (n >= 6)   return '👍';
  if (n >= 4)   return '😐';
  return '👎';
}

function progressBar(percent, length = 18) {
  const filled = Math.round((percent / 100) * length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
}

function milestone(percent) {
  if (percent === 100) return 'Coleção completa!';
  if (percent >= 75)   return 'Reta final!';
  if (percent >= 50)   return 'Passou da metade!';
  if (percent >= 25)   return 'Avançando bem!';
  if (percent > 0)     return 'Começando a jornada...';
  return 'Nenhum filme assistido ainda';
}

function accentColor(filter, percent) {
  if (filter === 'watched') return 0x2ECC71;
  if (filter === 'pending') return 0xF39C12;
  if (percent >= 75) return 0x2ECC71;
  if (percent >= 25) return 0x9B59B6;
  return 0x6C5CE7;
}

function movieRow(m, index) {
  const num = String(index).padStart(2, '0');
  if (!m.watched) return `\`${num}\`  ☐  ${m.name}`;

  const n    = m.note !== null ? parseFloat(m.note) : null;
  const star = n !== null ? `  ${stars(n)}` : '';
  const note = n !== null ? `  ${n.toFixed(1)}` : '';
  const date = m.watched_at ? `  ·  ${fmtDate(m.watched_at)}` : '';

  return `\`${num}\`  ✅  **${m.name}**${star}${note}${date}`;
}

function buildFilmesContainer(movies, filter) {
  const total   = movies.length;
  const watched = movies.filter(m =>  m.watched);
  const pending = movies.filter(m => !m.watched);
  const percent = total > 0 ? Math.round((watched.length / total) * 100) : 0;
  const rated   = watched.filter(m => m.note !== null);
  const avg     = rated.length > 0
    ? (rated.reduce((s, m) => s + parseFloat(m.note), 0) / rated.length).toFixed(1)
    : null;

  const list = filter === 'watched' ? watched
             : filter === 'pending' ? pending
             : movies;

  const c = new ContainerBuilder().setAccentColor(accentColor(filter, percent));

  // ── Cabeçalho ────────────────────────────────────────────────────────────────
  c.addTextDisplayComponents(txt(
    `# 🎬  P R E M I E R E\n` +
    `-# 🍿  Sala de cinema · Temporada 2026`
  ));
  c.addSeparatorComponents(sep());

  // ── Stats ─────────────────────────────────────────────────────────────────────
  c.addTextDisplayComponents(txt(
    `🎭  **${total}** filmes na lista  ·  ✅  **${watched.length}** assistidos  ·  ⏳  **${pending.length}** pendentes\n` +
    (avg
      ? `⭐  Nota média  **${avg} / 10**  ${stars(avg)}  ·  ${rated.length} avaliados\n`
      : `⭐  Nenhum filme avaliado ainda\n`) +
    `\`${progressBar(percent)}\`  **${percent}%**\n` +
    `-# ${milestone(percent)}`
  ));

  // ── Seção extra por aba ───────────────────────────────────────────────────────
  if (filter === 'watched' && rated.length > 0) {
    const top = [...watched]
      .filter(m => m.note !== null)
      .sort((a, b) => parseFloat(b.note) - parseFloat(a.note))
      .slice(0, 3);

    const medals = ['🥇','🥈','🥉'];
    const lines = top.map((m, i) => {
      const n = parseFloat(m.note);
      return `${medals[i]}  **${m.name}**  ${stars(n)}  ${n.toFixed(1)}  ${noteLabel(n)}`;
    }).join('\n');

    c.addSeparatorComponents(sep());
    c.addTextDisplayComponents(txt(`🏆  **Mais bem avaliados**\n${lines}`));
  }

  if (filter !== 'pending' && watched.length > 0) {
    const recent = [...watched]
      .sort((a, b) => {
        if (a.watched_at && b.watched_at) return new Date(b.watched_at) - new Date(a.watched_at);
        return b.id - a.id;
      })
      .slice(0, 3);

    const lines = recent.map(m => {
      const n    = m.note !== null ? parseFloat(m.note) : null;
      const star = n !== null ? `  ${stars(n)}  ${n.toFixed(1)}  ${noteLabel(n)}` : '';
      const date = m.watched_at ? `  ·  ${fmtDate(m.watched_at)}` : '';
      return `🎞  **${m.name}**${star}${date}`;
    }).join('\n');

    c.addSeparatorComponents(sep());
    c.addTextDisplayComponents(txt(`🕐  **Visto por último**\n${lines}`));
  }

  if (filter !== 'watched' && pending.length > 0) {
    c.addSeparatorComponents(sep());
    c.addTextDisplayComponents(txt(
      `🎯  **Próximo na fila**\n🍿  *${pending[0].name}*`
    ));
  }

  // ── Botões ────────────────────────────────────────────────────────────────────
  c.addSeparatorComponents(sep());
  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('filmes:all')
        .setLabel(`🎬  Todos  (${total})`)
        .setStyle(filter === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('filmes:watched')
        .setLabel(`✅  Assistidos  (${watched.length})`)
        .setStyle(filter === 'watched' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('filmes:pending')
        .setLabel(`⏳  Pendentes  (${pending.length})`)
        .setStyle(filter === 'pending' ? ButtonStyle.Danger : ButtonStyle.Secondary),
    )
  );

  // ── Lista ─────────────────────────────────────────────────────────────────────
  c.addSeparatorComponents(sep());

  if (list.length === 0) {
    c.addTextDisplayComponents(txt(
      filter === 'watched'
        ? `*Nenhum filme assistido ainda.*`
        : `*Todos os filmes já foram assistidos.*`
    ));
  } else {
    const chunks = [];
    for (let i = 0; i < list.length; i += 10) chunks.push(list.slice(i, i + 10));
    let idx = 1;
    for (let ci = 0; ci < chunks.length; ci++) {
      c.addTextDisplayComponents(txt(chunks[ci].map((m, li) => movieRow(m, idx + li)).join('\n')));
      idx += chunks[ci].length;
      if (ci < chunks.length - 1) c.addSeparatorComponents(sep());
    }
  }

  return c;
}

async function handleFilmesButton(interaction) {
  const filter    = interaction.customId.split(':')[1] ?? 'all';
  const movies    = await getAll();
  const container = buildFilmesContainer(movies, filter);
  await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

async function handlePainelButton(interaction) {
  const filter    = interaction.customId.split(':')[1] ?? 'all';
  const movies    = await getAll();
  const container = buildPanelContainer(movies, filter);
  await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

module.exports = { handleFilmesButton, handlePainelButton, buildFilmesContainer };
