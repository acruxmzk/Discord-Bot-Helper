const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { search, setNote } = require('../utils/movieDB');
const { refreshPanel }    = require('../utils/refreshPanel');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

function stars(note) {
  const full = Math.round(parseFloat(note) / 2);
  return '★'.repeat(Math.max(0, full)) + '☆'.repeat(Math.max(0, 5 - full));
}

function noteLabel(note) {
  const n = parseFloat(note);
  if (n >= 9)   return '🏆 Obra-prima';
  if (n >= 7.5) return '🔥 Excelente';
  if (n >= 6)   return '👍 Bom';
  if (n >= 4)   return '😐 Médio';
  return '👎 Fraco';
}

function noteColor(note) {
  const n = parseFloat(note);
  if (n >= 8)  return 0x2ECC71;
  if (n >= 6)  return 0xF39C12;
  if (n >= 4)  return 0xE67E22;
  return 0xE74C3C;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nota')
    .setDescription('⭐ Registra ou atualiza a avaliação de um filme (0 a 10)')
    .addStringOption(o =>
      o.setName('filme')
        .setDescription('Nome do filme (autocomplete)')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addNumberOption(o =>
      o.setName('nota')
        .setDescription('Avaliação de 0 a 10')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(10)
    ),

  async autocomplete(interaction) {
    const results = await search(interaction.options.getFocused() || '');
    await interaction.respond(results.map(m => ({ name: m.name, value: m.name })));
  },

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const name = interaction.options.getString('filme');
    const nota = interaction.options.getNumber('nota');
    const movie = await setNote(name, nota);

    if (!movie) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xE74C3C)
            .addTextDisplayComponents(txt(
              `**${name}** não encontrado.\n` +
              `-# Use /adicionar para incluí-lo primeiro.`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const n = parseFloat(movie.note);

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(noteColor(n))
          .addTextDisplayComponents(txt(
            `⭐  **${movie.name}**\n` +
            `${stars(n)}  ${n.toFixed(1)}  ·  ${noteLabel(n)}`
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(`-# Premiere`)),
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    refreshPanel(interaction.guildId).catch(e => console.error('[refreshPanel]', e));
  },
};
