const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { search, markWatched, setNote } = require('../utils/movieDB');
const { refreshPanel } = require('../utils/refreshPanel');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

function stars(note) {
  const n = parseFloat(note);
  const full = Math.round(n / 2);
  return '★'.repeat(Math.max(0, full)) + '☆'.repeat(Math.max(0, 5 - full));
}

function noteLabel(note) {
  const n = parseFloat(note);
  if (n >= 9)   return '🏆 Obra-prima!';
  if (n >= 7.5) return '🔥 Excelente!';
  if (n >= 6)   return '👍 Bom!';
  if (n >= 4)   return '😐 Médio';
  return '👎 Fraco';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assistido')
    .setDescription('✅ Marca um filme como assistido e registra a nota')
    .addStringOption(o =>
      o.setName('filme')
        .setDescription('Nome do filme (autocomplete ativo)')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addNumberOption(o =>
      o.setName('nota')
        .setDescription('Avaliação de 0 a 10 — ex: 8.5 (opcional)')
        .setMinValue(0)
        .setMaxValue(10)
        .setRequired(false)
    ),

  async autocomplete(interaction) {
    const query = interaction.options.getFocused();
    const results = await search(query || '');
    await interaction.respond(results.map(m => ({ name: m.name, value: m.name })));
  },

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const name = interaction.options.getString('filme');
    const nota = interaction.options.getNumber('nota') ?? null;

    let movie = await markWatched(name);

    if (!movie) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xE74C3C)
            .addTextDisplayComponents(txt('## ❌  Filme não encontrado'))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(
              `> Não encontrei **${name}** na watchlist.\n` +
              `> Use \`/adicionar\` para incluí-lo primeiro.`
            ))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(`-# 🍿  Premiere · Filme não encontrado`)),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const alreadyWatched = movie.already_watched === true;

    // Atualiza nota se informada
    if (nota !== null) {
      movie = await setNote(movie.name, nota) ?? movie;
    }

    const hasNote  = movie.note !== null;
    const dateStr  = movie.watched_at
      ? new Date(movie.watched_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
      : null;

    const noteLine = hasNote
      ? `⭐  **${parseFloat(movie.note).toFixed(1)} / 10**  ${stars(movie.note)}  ·  ${noteLabel(movie.note)}`
      : `💡  *Sem nota — use \`/nota\` para avaliar!*`;

    // Já estava assistido + nenhuma nota nova
    if (alreadyWatched && nota === null) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xF39C12)
            .addTextDisplayComponents(txt('## ⚠️  Já estava assistido'))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(
              `🎬  **${movie.name}**\n\n` +
              (dateStr ? `📅  Assistido em  **${dateStr}**\n` : '') +
              noteLine
            ))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(
              `> 💡  Use a opção \`nota\` neste comando para atualizar a avaliação.`
            ))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(`-# 🍿  Premiere · Nenhuma alteração realizada`)),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      refreshPanel(interaction.guildId).catch(e => console.error('[refreshPanel]', e));
      return;
    }

    const title = alreadyWatched
      ? '## 📝  Nota atualizada!'
      : '## ✅  Marcado como assistido!';

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x2ECC71)
          .addTextDisplayComponents(txt(title))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `🎬  **${movie.name}**\n\n` +
            (dateStr ? `📅  Data:  **${dateStr}**\n` : '') +
            noteLine
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(`-# ✨  Premiere · Painel atualizado automaticamente`)),
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    refreshPanel(interaction.guildId).catch(e => console.error('[refreshPanel]', e));
  },
};
