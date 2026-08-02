const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

function fmtDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  const m = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${d.getDate()} ${m[d.getMonth()]}`;
}

function stars(note) {
  const full = Math.round(parseFloat(note) / 2);
  return '★'.repeat(Math.max(0, full)) + '☆'.repeat(Math.max(0, 5 - full));
}

function accentColor(filter, percent) {
  if (filter === 'watched') return 0x2ECC71;
  if (filter === 'pending') return 0xF39C12;
  if (percent >= 75) return 0x2ECC71;
  if (percent >= 25) return 0x9B59B6;
  return 0x6C5CE7;
}

// ── Linha: `01`  ✅  **Nome**  ★★★☆☆  7.5  ·  28 Jul
//           `02`  ☐  Nome pendente
function movieRow(m, index) {
  const num = String(index).padStart(2, '0');
  if (!m.watched) return `\`${num}\`  ☐  ${m.name}`;

  const n      = m.note !== null ? parseFloat(m.note) : null;
  const star   = n !== null ? `  ${stars(n)}` : '';
  const note   = n !== null ? `  ${n.toFixed(1)}` : '';
  const date   = m.watched_at ? `  ·  ${fmtDate(m.watched_at)}` : '';

  return `\`${num}\`  ✅  **${m.name}**${star}${note}${date}`;
}

function buildPanelContainer(movies, filter = 'all') {
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

  // ── Header ───────────────────────────────────────────────────────────────────
  const avgStr = avg ? `  ·  ★ ${avg}` : '';
  c.addTextDisplayComponents(txt(
    `🎬  **Premiere**\n` +
    `-# ${watched.length}/${total} assistidos  ·  ${pending.length} pendentes${avgStr}`
  ));

  // ── Botões ────────────────────────────────────────────────────────────────────
  c.addSeparatorComponents(sep());
  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('painel:all')
        .setLabel(`Todos  ${total}`)
        .setStyle(filter === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('painel:watched')
        .setLabel(`Assistidos  ${watched.length}`)
        .setStyle(filter === 'watched' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('painel:pending')
        .setLabel(`Pendentes  ${pending.length}`)
        .setStyle(filter === 'pending' ? ButtonStyle.Danger : ButtonStyle.Secondary),
    )
  );

  // ── Lista ─────────────────────────────────────────────────────────────────────
  c.addSeparatorComponents(sep());

  if (list.length === 0) {
    c.addTextDisplayComponents(txt(
      filter === 'watched'
        ? `*Nenhum filme assistido ainda.*`
        : `*Todos os filmes foram assistidos.*`
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

module.exports = { buildPanelContainer };
