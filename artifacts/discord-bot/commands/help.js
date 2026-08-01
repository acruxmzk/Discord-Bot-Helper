const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function gap() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📖 Mostra todos os comandos disponíveis do Premiere'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    await interaction.editReply({
      components: [
        // ── Cabeçalho ──────────────────────────────────────────────────────────
        new ContainerBuilder()
          .setAccentColor(0x9B59B6)
          .addTextDisplayComponents(txt(
            `# 🎬  P R E M I E R E\n` +
            `-# 📖  Central de Comandos · Guia completo`
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `> 🍿  Bem-vindo ao **Premiere** — sua sala de cinema no Discord!\n` +
            `> Gerencie sua watchlist, registre avaliações e acompanhe seu progresso.`
          )),

        // ── Comandos principais ────────────────────────────────────────────────
        new ContainerBuilder()
          .setAccentColor(0x2ECC71)
          .addTextDisplayComponents(txt('## 📋  Comandos'))
          .addSeparatorComponents(sep())

          .addTextDisplayComponents(txt(
            `### 🎬  \`/adicionar\`\n` +
            `> Adiciona um novo filme à watchlist.\n` +
            `> 📌  \`filme\` — Nome do filme *(obrigatório)*\n` +
            `> ✅  \`assistido\` — Já assistiu? *(opcional)*\n` +
            `> ⭐  \`nota\` — Avaliação de 0 a 10 *(opcional)*\n` +
            `-# 💡 Você pode adicionar, marcar como assistido e avaliar num único comando!`
          ))
          .addSeparatorComponents(sep())

          .addTextDisplayComponents(txt(
            `### ✅  \`/assistido\`\n` +
            `> Marca um filme como assistido e registra a nota.\n` +
            `> 📌  \`filme\` — Autocomplete ativo *(obrigatório)*\n` +
            `> ⭐  \`nota\` — Avaliação de 0 a 10 *(opcional)*\n` +
            `-# 💡 Se o filme já estava assistido, apenas a nota será atualizada.`
          ))
          .addSeparatorComponents(sep())

          .addTextDisplayComponents(txt(
            `### ⭐  \`/nota\`\n` +
            `> Registra ou atualiza a avaliação de um filme.\n` +
            `> 📌  \`filme\` — Autocomplete ativo *(obrigatório)*\n` +
            `> ⭐  \`nota\` — Avaliação de 0 a 10 *(obrigatório)*\n` +
            `-# 💡 Escala: 🏆 ≥9.0 · 🔥 ≥7.5 · 👍 ≥6.0 · 😐 ≥4.0 · 👎 abaixo de 4`
          ))
          .addSeparatorComponents(sep())

          .addTextDisplayComponents(txt(
            `### 🗑️  \`/remover\`\n` +
            `> Remove um filme da watchlist.\n` +
            `> 📌  \`filme\` — Autocomplete ativo *(obrigatório)*\n` +
            `-# ⚠️ Esta ação não pode ser desfeita.`
          ))
          .addSeparatorComponents(sep())

          .addTextDisplayComponents(txt(
            `### 🎞️  \`/filmes\`\n` +
            `> Abre a lista completa da watchlist (visível só para você).\n` +
            `> Use os botões para filtrar: 🎬 Todos · ✅ Assistidos · ⏳ Pendentes\n` +
            `-# 💡 Mostra nota média, top avaliados e próximo na fila.`
          ))
          .addSeparatorComponents(sep())

          .addTextDisplayComponents(txt(
            `### 📺  \`/painel\`\n` +
            `> Posta o painel fixo do Premiere neste canal.\n` +
            `> O painel se atualiza automaticamente quando você usa os outros comandos.\n` +
            `-# 💡 Poste uma vez e nunca mais precise postar de novo!`
          ))
          .addSeparatorComponents(sep())

          .addTextDisplayComponents(txt(
            `### 📖  \`/help\`\n` +
            `> Exibe esta central de ajuda.\n` +
            `-# 💡 Visível apenas para você (ephemeral).`
          )),

        // ── Dicas rápidas ──────────────────────────────────────────────────────
        new ContainerBuilder()
          .setAccentColor(0xF39C12)
          .addTextDisplayComponents(txt('## 💡  Dicas rápidas'))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `🔍  **Autocomplete** — Nos comandos \`/assistido\`, \`/nota\` e \`/remover\`, ` +
            `basta começar a digitar o nome do filme e o Discord sugere automaticamente.\n\n` +
            `⭐  **Sistema de estrelas** — As notas aparecem visualmente com ★:\n` +
            `> \`9.0\` → ★★★★★  🏆\n` +
            `> \`8.0\` → ★★★★☆  🔥\n` +
            `> \`6.0\` → ★★★☆☆  👍\n` +
            `> \`4.0\` → ★★☆☆☆  😐\n\n` +
            `📺  **Painel automático** — Após usar qualquer comando, o painel fixo é ` +
            `atualizado sozinho em segundo plano.`
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(
            `-# 🎬  Premiere · Todos os comandos são visíveis apenas para você (ephemeral)`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
