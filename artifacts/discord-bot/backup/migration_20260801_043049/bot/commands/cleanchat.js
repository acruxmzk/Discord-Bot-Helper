const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cleanchat')
    .setDescription('Apaga todas as mensagens do canal atual')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channel = interaction.channel;
    let totalDeleted = 0;

    try {
      // Bulk delete handles messages < 14 days (Discord limit).
      // Keep looping until nothing is left to bulk-delete.
      let fetched;
      do {
        fetched = await channel.messages.fetch({ limit: 100 });
        if (fetched.size === 0) break;

        const deleted = await channel.bulkDelete(fetched, true); // true = skip >14d msgs
        totalDeleted += deleted.size;

        // If bulkDelete returned 0 but there were messages, they are all >14 days old.
        // Delete them one by one.
        if (deleted.size === 0 && fetched.size > 0) {
          for (const msg of fetched.values()) {
            try {
              await msg.delete();
              totalDeleted++;
              await new Promise(r => setTimeout(r, 500)); // respect rate limit
            } catch {
              // ignore individual delete errors (e.g. already deleted)
            }
          }
          break;
        }

        await new Promise(r => setTimeout(r, 1000)); // small pause between batches
      } while (fetched.size >= 2);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🧹 Chat limpo')
            .setColor('#00C853')
            .setDescription(`**${totalDeleted}** mensagem(ns) apagada(s) com sucesso.`)
            .setFooter({ text: `Executado por ${interaction.user.username}` })
            .setTimestamp(),
        ],
      });
    } catch (error) {
      console.error('[cleanchat] Erro:', error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro ao limpar o chat')
            .setColor('#FF0000')
            .setDescription(`Ocorreu um erro: ${error.message}`)
            .setTimestamp(),
        ],
      });
    }
  },
};
