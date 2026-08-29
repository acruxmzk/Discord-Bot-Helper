const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require('discord.js');
const { search, getByName, markWatched, setNote } = require('../utils/movieDB');
const { refreshPanel } = require('../utils/refreshPanel');

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

function noteLabel(note) {
  const n = parseFloat(note);
  if (n >= 9)   return '🏆 Obra-prima';
  if (n >= 7.5) return '🔥 Excelente';
  if (n >= 6)   return '👍 Bom';
  if (n >= 4)   return '😐 Médio';
  return '👎 Fraco';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assistido')
    .setDescription('✅ Marca um filme como assistido e registra a nota')
    .addStringOption(o =>
      o.setName('filme').setDescription('Nome do filme (autocomplete)').setRequired(true).setAutocomplete(true)
    )
    .addNumberOption(o =>
      o.setName('nota').setDescription('Avaliação de 0 a 10').setMinValue(0).setMaxValue(10).setRequired(false)
    ),

  async autocomplete(interaction) {
    const results = await search(interaction.options.getFocused() || '');
    await interaction.respond(results.map(m => ({ name: m.name, value: m.name })));
  },

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const name = interaction.options.getString('filme');
    const nota = interaction.options.getNumber('nota') ?? null;

    // O título precisa existir na watchlist. Validamos antes do UPDATE para
    // impedir que uma entrada digitada livremente crie/avalie um filme fora
    // da lista oficial.
    const listedMovie = await getByName(name);
    if (!listedMovie) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xE74C3C)
            .addTextDisplayComponents(txt(
              `**${name}**\n` +
              `-# não está na lista  ·  escolha um título do autocomplete ou use /adicionar`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    let movie = await markWatched(listedMovie.name);

    if (!movie) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xE74C3C)
            .addTextDisplayComponents(txt(
              `**${name}**\n` +
              `-# não encontrado  ·  use /adicionar para incluí-lo`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const alreadyWatched = movie.already_watched === true;
    if (nota !== null) movie = await setNote(movie.name, nota) ?? movie;

    const n       = movie.note !== null ? parseFloat(movie.note) : null;
    const dateStr = movie.watched_at ? fmtDate(movie.watched_at) : null;

    // Já estava assistido e não passou nota — informa sem alterar nada
    if (alreadyWatched && nota === null) {
      const details = [
        n !== null ? `${stars(n)}  ${n.toFixed(1)}` : 'sem nota',
        dateStr,
      ].filter(Boolean).join('  ·  ');

      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xF39C12)
            .addTextDisplayComponents(txt(
              `**${movie.name}**\n` +
              `-# já assistido  ·  ${details}`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      refreshPanel(interaction.guildId).catch(e => console.error('[refreshPanel]', e));
      return;
    }

    const details = [
      n !== null ? `${stars(n)}  ${n.toFixed(1)}` : null,
      dateStr,
      n !== null ? noteLabel(n) : null,
    ].filter(Boolean).join('  ·  ');

    const action = alreadyWatched ? 'nota atualizada' : 'assistido';

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x2ECC71)
          .addTextDisplayComponents(txt(
            `**${movie.name}**\n` +
            `-# ✅  ${action}${details ? '  ·  ' + details : ''}`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    refreshPanel(interaction.guildId).catch(e => console.error('[refreshPanel]', e));
  },
};
