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

function fmtDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

function progressBar(percent, length = 16) {
  const filled = Math.round((percent / 100) * length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
}

function accentColor(filter, percent) {
  if (filter === 'watched') return 0x2ECC71;
  if (filter === 'pending') return 0xF39C12;
  if (percent >= 75) return 0x2ECC71;
  if (percent >= 25) return 0x9B59B6;
  return 0x6C5CE7;
}

function movieRow(m) {
  if (!m.watched) return `◻  ${m.name}`;
  const n    = m.note !== null ? parseFloat(m.note) : null;
  const star = n !== null ? `  ${stars(n)}  ${n.toFixed(1)}` : '';
  return `✅  **${m.name}**${star}`;
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

  const list   = filter === 'watched' ? watched
               : filter === 'pending' ? pending
               : movies;

  const c = new ContainerBuilder().setAccentColor(accentColor(filter, percent));

  // ── Cabeçalho + stats ────────────────────────────────────────────────────────
  const avgStr = avg ? `  ·  ★ ${avg}` : '';
  c.addTextDisplayComponents(txt(
    `🎬  **Premiere**\n` +
    `${watched.length}/${total} assistidos  ·  ${pending.length} pendentes${avgStr}\n` +
    `-# \`${progressBar(percent)}\`  ${percent}%`
  ));

  // ── Seção extra por aba ───────────────────────────────────────────────────────
  if (filter === 'watched' && avg) {
    const top = [...watched]
      .filter(m => m.note !== null)
      .sort((a, b) => parseFloat(b.note) - parseFloat(a.note))
      .slice(0, 3);

    if (top.length > 0) {
      const medals = ['🥇', '🥈', '🥉'];
      const lines = top.map((m, i) => {
        const n = parseFloat(m.note);
        return `${medals[i]}  **${m.name}**  ${stars(n)}  ${n.toFixed(1)}  ${noteLabel(n)}`;
      }).join('\n');
      c.addSeparatorComponents(sep());
      c.addTextDisplayComponents(txt(`-# Mais bem avaliados\n${lines}`));
    }
  }

  if (filter === 'all' && watched.length > 0) {
    const last = [...watched]
      .sort((a, b) => {
        if (a.watched_at && b.watched_at) return new Date(b.watched_at) - new Date(a.watched_at);
        return b.id - a.id;
      })[0];
    const n    = last.note !== null ? parseFloat(last.note) : null;
    const star = n !== null ? `  ${stars(n)}  ${n.toFixed(1)}  ${noteLabel(n)}` : '';
    const date = last.watched_at ? `  ·  ${fmtDate(last.watched_at)}` : '';
    c.addSeparatorComponents(sep());
    c.addTextDisplayComponents(txt(`-# Último assistido\n🎞  **${last.name}**${star}${date}`));
  }

  if (filter === 'pending' && pending.length > 0) {
    c.addSeparatorComponents(sep());
    c.addTextDisplayComponents(txt(`-# Próximo na fila\n🍿  ${pending[0].name}`));
  }

  // ── Botões ────────────────────────────────────────────────────────────────────
  c.addSeparatorComponents(sep());
  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('filmes:all')
        .setLabel(`Todos  ${total}`)
        .setStyle(filter === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('filmes:watched')
        .setLabel(`✅  ${watched.length}`)
        .setStyle(filter === 'watched' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('filmes:pending')
        .setLabel(`⏳  ${pending.length}`)
        .setStyle(filter === 'pending' ? ButtonStyle.Danger : ButtonStyle.Secondary),
    )
  );

  // ── Lista ─────────────────────────────────────────────────────────────────────
  c.addSeparatorComponents(sep());

  if (list.length === 0) {
    c.addTextDisplayComponents(txt(
      filter === 'watched'
        ? `*Nenhum filme assistido ainda.*`
        : `*Todos os filmes já foram assistidos!*`
    ));
  } else {
    const chunks = [];
    for (let i = 0; i < list.length; i += 10) chunks.push(list.slice(i, i + 10));
    for (let ci = 0; ci < chunks.length; ci++) {
      c.addTextDisplayComponents(txt(chunks[ci].map(movieRow).join('\n')));
      if (ci < chunks.length - 1) c.addSeparatorComponents(sep());
    }
  }

  // ── Rodapé ────────────────────────────────────────────────────────────────────
  c.addSeparatorComponents(sep());
  c.addTextDisplayComponents(txt(`-# Premiere  ·  /adicionar  /assistido  /nota  /remover`));

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
