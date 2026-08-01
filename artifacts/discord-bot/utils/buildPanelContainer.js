const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// ── Helpers visuais ────────────────────────────────────────────────────────────
function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function gap() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

function progressBar(percent, length = 18) {
  const filled = Math.round((percent / 100) * length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
}

function stars(note) {
  if (note === null) return '';
  const n = parseFloat(note);
  const full  = Math.round(n / 2);
  const empty = 5 - full;
  return '★'.repeat(Math.max(0, full)) + '☆'.repeat(Math.max(0, empty));
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

function fmtDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

function milestone(percent) {
  if (percent === 100) return '🏆  Coleção 100% completa! Incrível!'  ;
  if (percent >= 75)   return '🚀  Reta final — quase lá!'            ;
  if (percent >= 50)   return '🔥  Passando da metade!'               ;
  if (percent >= 25)   return '📈  Avançando bem!'                    ;
  if (percent >  0)    return '🌱  A jornada está começando...'       ;
  return                      '🎬  Nenhum filme assistido ainda'      ;
}

function accentColor(filter, percent) {
  if (filter === 'watched') return 0x2ECC71;
  if (filter === 'pending') return 0xF39C12;
  if (percent >= 75) return 0x2ECC71;
  if (percent >= 25) return 0x9B59B6;
  return 0x6C5CE7;
}

function formatMovieRow(m, index) {
  if (!m.watched) return `\`${String(index).padStart(2,'0')}\`  ◻️  ${m.name}`;
  const n    = m.note !== null ? parseFloat(m.note) : null;
  const star = n !== null ? `  ${stars(n)} \`${n.toFixed(1)}\`` : '';
  const date = m.watched_at ? `  ·  📅 ${fmtDate(m.watched_at)}` : '';
  return `\`${String(index).padStart(2,'0')}\`  ✅  **${m.name}**${star}${date}`;
}

// ── Builder principal ──────────────────────────────────────────────────────────
function buildPanelContainer(movies, filter = 'all') {
  const total   = movies.length;
  const watched = movies.filter(m =>  m.watched);
  const pending = movies.filter(m => !m.watched);
  const percent = total > 0 ? Math.round((watched.length / total) * 100) : 0;
  const rated   = watched.filter(m => m.note !== null);
  const avgNote = rated.length > 0
    ? (rated.reduce((s, m) => s + parseFloat(m.note), 0) / rated.length).toFixed(1)
    : null;

  const list   = filter === 'watched' ? watched
               : filter === 'pending' ? pending
               : movies;

  const accent = accentColor(filter, percent);
  const c = new ContainerBuilder().setAccentColor(accent);

  // ── Cabeçalho ────────────────────────────────────────────────────────────────
  c.addTextDisplayComponents(txt(
    `# 🎬  P R E M I E R E\n` +
    `-# 🍿  Sala de cinema · Temporada 2026`
  ));
  c.addSeparatorComponents(sep());

  // ── Stats rápidos ────────────────────────────────────────────────────────────
  c.addTextDisplayComponents(txt(
    `> 📽️  **${total}** filmes na lista  ·  ` +
    `✅  **${watched.length}** assistidos  ·  ` +
    `⏳  **${pending.length}** pendentes\n` +
    (avgNote
      ? `> ⭐  Nota média  **${avgNote} / 10**  ${stars(avgNote)}  ` +
        `·  ${rated.length} avaliado${rated.length !== 1 ? 's' : ''}\n`
      : `> ⭐  Nenhum filme avaliado ainda\n`) +
    `> \`${progressBar(percent)}\`  **${percent}%**\n` +
    `-# ${milestone(percent)}`
  ));
  c.addSeparatorComponents(sep());

  // ── Recentes (só na aba "todos" e "assistidos") ───────────────────────────────
  if (filter !== 'pending' && watched.length > 0) {
    const recent = [...watched]
      .sort((a, b) => {
        if (a.watched_at && b.watched_at) return new Date(b.watched_at) - new Date(a.watched_at);
        return b.id - a.id;
      })
      .slice(0, 3);

    const lines = recent.map(m => {
      const n    = m.note !== null ? parseFloat(m.note) : null;
      const star = n !== null ? `  ${stars(n)} \`${n.toFixed(1)}\`  ${noteLabel(n)}` : '';
      const date = m.watched_at ? `  ·  📅 ${fmtDate(m.watched_at)}` : '';
      return `🎞️  **${m.name}**${star}${date}`;
    }).join('\n');

    c.addTextDisplayComponents(txt(`**🕐  Visto por último**\n${lines}`));
    c.addSeparatorComponents(sep());
  }

  // ── Próximo na fila ───────────────────────────────────────────────────────────
  if (filter !== 'watched' && pending.length > 0) {
    c.addTextDisplayComponents(txt(
      `**🎯  Próximo na fila**\n` +
      `🍿  *${pending[0].name}*`
    ));
    c.addSeparatorComponents(sep());
  }

  // ── Botões de filtro ──────────────────────────────────────────────────────────
  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('painel:all')
        .setLabel(`🎬  Todos  (${total})`)
        .setStyle(filter === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('painel:watched')
        .setLabel(`✅  Assistidos  (${watched.length})`)
        .setStyle(filter === 'watched' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('painel:pending')
        .setLabel(`⏳  Pendentes  (${pending.length})`)
        .setStyle(filter === 'pending' ? ButtonStyle.Danger : ButtonStyle.Secondary),
    )
  );
  c.addSeparatorComponents(sep());

  // ── Lista ─────────────────────────────────────────────────────────────────────
  if (list.length === 0) {
    c.addSeparatorComponents(gap());
    c.addTextDisplayComponents(txt(
      filter === 'watched'
        ? `*📭  Nenhum filme assistido ainda — use \`/assistido\` para registrar!*`
        : `*🎉  Todos os filmes foram assistidos! Incrível!*`
    ));
    c.addSeparatorComponents(gap());
  } else {
    const chunks = [];
    for (let i = 0; i < list.length; i += 10) chunks.push(list.slice(i, i + 10));

    // Numeração global para assistidos/todos, local para pendentes
    let globalIdx = filter === 'pending'
      ? 1
      : (filter === 'watched' ? 1 : 1);

    for (let ci = 0; ci < chunks.length; ci++) {
      const lines = chunks[ci].map((m, li) => formatMovieRow(m, globalIdx + li)).join('\n');
      globalIdx += chunks[ci].length;
      c.addTextDisplayComponents(txt(lines));
      if (ci < chunks.length - 1) c.addSeparatorComponents(sep());
    }
  }

  // ── Rodapé ────────────────────────────────────────────────────────────────────
  c.addSeparatorComponents(sep());
  c.addTextDisplayComponents(txt(
    `-# 🎬  Premiere  ·  /adicionar  ·  /assistido  ·  /nota  ·  /remover`
  ));

  return c;
}

module.exports = { buildPanelContainer };
