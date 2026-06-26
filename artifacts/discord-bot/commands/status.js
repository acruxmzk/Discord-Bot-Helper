const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { getAll } = require('../utils/movieDB');

function sep()  { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

function progressBar(percent, length = 16) {
  const filled = Math.round((percent / 100) * length);
  return '▓'.repeat(filled) + '░'.repeat(length - filled);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Mostra o progresso geral da watchlist'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const movies  = await getAll();
    const total   = movies.length;
    const watched = movies.filter(m => m.watched).length;
    const pending = total - watched;
    const percent = total > 0 ? Math.round((watched / total) * 100) : 0;
    const rated   = movies.filter(m => m.note !== null);
    const avgNote = rated.length > 0
      ? (rated.reduce((acc, m) => acc + parseFloat(m.note), 0) / rated.length).toFixed(1)
      : null;

    const bar = progressBar(percent);

    const avgStr = avgNote
      ? `⭐  Nota média  **${avgNote}** / 10  ·  -# ${rated.length} avaliado${rated.length !== 1 ? 's' : ''}`
      : `⭐  Nenhum filme avaliado ainda`;

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x6C5CE7)
          .addTextDisplayComponents(txt(
            `### ✨  Premiere  🌙\n` +
            `-# Sua sala de cinema particular`
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `🎞️  **${watched}** assistidos  ·  **${pending}** na fila  ·  **${total}** total\n` +
            `\`${bar}\`  **${percent}%**\n` +
            avgStr
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `-# 🌙  ${pending} filme${pending !== 1 ? 's' : ''} ainda na fila para assistir`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
