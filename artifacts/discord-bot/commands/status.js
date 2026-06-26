const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { getAll } = require('../utils/movieDB');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

function progressBar(percent, length = 10) {
  const filled = Math.round((percent / 100) * length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Mostra o progresso geral da watchlist'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const movies = await getAll();
    const total   = movies.length;
    const watched = movies.filter(m => m.watched).length;
    const percent = total > 0 ? Math.round((watched / total) * 100) : 0;

    const rated  = movies.filter(m => m.note !== null);
    const avgNote = rated.length > 0
      ? (rated.reduce((acc, m) => acc + parseFloat(m.note), 0) / rated.length).toFixed(1)
      : '—';

    const bar = progressBar(percent);

    await interaction.reply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x5865F2)
          .addTextDisplayComponents(txt(`### 🎬 Movie Tracker`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `**Assistidos:** ${watched}/${total}\n` +
            `**Progresso:** ${percent}%\n` +
            `\`${bar}\`\n` +
            `**Nota média:** ⭐ ${avgNote}`
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(`-# ${total - watched} filme${total - watched !== 1 ? 's' : ''} restante${total - watched !== 1 ? 's' : ''}`)),
      ],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true,
    });
  },
};
