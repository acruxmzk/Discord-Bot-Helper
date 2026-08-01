const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { search, removeMovie } = require('../utils/movieDB');
const { refreshPanel }        = require('../utils/refreshPanel');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

function stars(note) {
  if (note === null) return '';
  const n = parseFloat(note);
  const full = Math.round(n / 2);
  return '★'.repeat(Math.max(0, full)) + '☆'.repeat(Math.max(0, 5 - full));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remover')
    .setDescription('🗑️ Remove um filme da watchlist do Premiere')
    .addStringOption(o =>
      o.setName('filme')
        .setDescription('Nome do filme (autocomplete ativo)')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const query = interaction.options.getFocused();
    const results = await search(query || '');
    await interaction.respond(results.map(m => ({ name: m.name, value: m.name })));
  },

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const name  = interaction.options.getString('filme');
    const movie = await removeMovie(name);

    if (!movie) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xE74C3C)
            .addTextDisplayComponents(txt('## ❌  Filme não encontrado'))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(
              `> Não encontrei **${name}** na watchlist.\n` +
              `> Verifique o nome ou use \`/filmes\` para ver a lista.`
            ))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(`-# 🍿  Premiere · Filme não encontrado`)),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const wasWatched = movie.watched;
    const hasNote    = movie.note !== null;
    const noteStr    = hasNote
      ? `\n⭐  Tinha nota:  **${parseFloat(movie.note).toFixed(1)} / 10**  ${stars(movie.note)}`
      : '';
    const statusStr  = wasWatched ? `✅  Estava assistido` : `⏳  Estava na fila de espera`;

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xE74C3C)
          .addTextDisplayComponents(txt('## 🗑️  Filme removido'))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `🎬  **${movie.name}**\n\n` +
            `📌  ${statusStr}` +
            noteStr
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `> ⚠️  Esta ação não pode ser desfeita.\n` +
            `-# ✨  Premiere · Painel atualizado automaticamente`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    refreshPanel(interaction.guildId).catch(e => console.error('[refreshPanel]', e));
  },
};
