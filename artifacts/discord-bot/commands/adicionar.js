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
function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adicionar')
    .setDescription('Adiciona um novo filme à watchlist')
    .addStringOption(o =>
      o.setName('filme')
        .setDescription('Nome do filme')
        .setRequired(true)
        .setMaxLength(200)
    )
    .addBooleanOption(o =>
      o.setName('assistido')
        .setDescription('Já assistiu? (opcional)')
    )
    .addNumberOption(o =>
      o.setName('nota')
        .setDescription('Nota de 0 a 10 (opcional)')
        .setMinValue(0)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const name    = interaction.options.getString('filme').trim();
    const watched = interaction.options.getBoolean('assistido') ?? false;
    const nota    = interaction.options.getNumber('nota');

    const added = await addMovie(name);

    if (!added) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFF4444)
            .addTextDisplayComponents(txt(
              `### ⚠️ Filme já existe\n\`${name}\` já está na watchlist.`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    let movie = added;
    if (watched) movie = await markWatched(name) ?? movie;
    if (nota !== null) movie = await setNote(name, nota) ?? movie;

    const statusStr = movie.watched ? '☑ Assistido' : '☐ Não assistido';
    const noteStr   = movie.note !== null ? `\n⭐ **${parseFloat(movie.note)}/10**` : '';

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x57F287)
          .addTextDisplayComponents(txt(`### ➕ Filme adicionado`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `🎬 **${movie.name}**\n` +
            `📌 ${statusStr}` +
            noteStr
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    refreshPanel(interaction.guildId).catch(() => {});
  },
};
