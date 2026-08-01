const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { addMovie, markWatched, setNote } = require('../utils/movieDB');
const { refreshPanel } = require('../utils/refreshPanel');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function gap() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false); }
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
    .setName('adicionar')
    .setDescription('🎬 Adiciona um novo filme à watchlist do Premiere')
    .addStringOption(o =>
      o.setName('filme')
        .setDescription('Nome do filme (ex: Vingadores: Ultimato)')
        .setRequired(true)
        .setMaxLength(200)
    )
    .addBooleanOption(o =>
      o.setName('assistido')
        .setDescription('Já assistiu este filme?')
        .setRequired(false)
    )
    .addNumberOption(o =>
      o.setName('nota')
        .setDescription('Avaliação de 0 a 10 — ex: 8.5 (opcional, funciona mesmo sem marcar assistido)')
        .setMinValue(0)
        .setMaxValue(10)
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const name     = interaction.options.getString('filme').trim();
    const watched  = interaction.options.getBoolean('assistido') ?? false;
    const nota     = interaction.options.getNumber('nota') ?? null;

    // Tenta adicionar
    const added = await addMovie(name);

    if (!added) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xE74C3C)
            .addTextDisplayComponents(txt('## ⚠️  Filme já cadastrado'))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(
              `🎬  **${name}**\n\n` +
              `> Este filme já está na sua watchlist!\n` +
              `> Use \`/assistido\` para marcá-lo ou \`/nota\` para avaliar.`
            ))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(`-# 🍿  Premiere · Filme já existe na lista`)),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    // Aplica assistido e/ou nota se informados
    let movie = added;
    if (watched || nota !== null) movie = await markWatched(name) ?? movie;
    if (nota !== null)            movie = await setNote(name, nota) ?? movie;

    // Monta resposta premium
    const isWatched = movie.watched;
    const hasNote   = movie.note !== null;
    const accentColor = isWatched ? 0x2ECC71 : 0x9B59B6;

    const statusLine = isWatched
      ? `📌  Status:  ✅  Assistido`
      : `📌  Status:  ⏳  Na fila de espera`;

    const noteLine = hasNote
      ? `\n⭐  Nota:  **${parseFloat(movie.note).toFixed(1)} / 10**  ${stars(movie.note)}  ·  ${noteLabel(movie.note)}`
      : `\n💡  *Sem nota ainda — use \`/nota\` para avaliar depois!*`;

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(accentColor)
          .addTextDisplayComponents(txt('## 🎬  Filme adicionado!'))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `🍿  **${movie.name}**\n\n` +
            statusLine +
            noteLine
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `-# ✨  Premiere · Painel atualizado automaticamente`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    refreshPanel(interaction.guildId).catch(e => console.error('[refreshPanel]', e));
  },
};
