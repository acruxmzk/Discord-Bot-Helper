const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📖 Mostra todos os comandos do Premiere'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    await interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x9B59B6)
          .addTextDisplayComponents(txt(`🎬  **Premiere** — Comandos`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `/adicionar  ·  adiciona à watchlist *(assistido e nota opcionais)*\n` +
            `/assistido  ·  marca como visto + avaliação\n` +
            `/nota       ·  avalia um filme de 0 a 10\n` +
            `/remover    ·  remove da lista\n` +
            `/filmes     ·  sua watchlist com filtros\n` +
            `/duracao    ·  calcula o tempo pelo TMDB\n` +
            `/painel     ·  posta o painel fixo no canal\n` +
            `/help       ·  este menu`
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `-# autocomplete ativo em /assistido /nota /remover  ·  notas: 🏆≥9  🔥≥7.5  👍≥6  😐≥4  👎<4`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
