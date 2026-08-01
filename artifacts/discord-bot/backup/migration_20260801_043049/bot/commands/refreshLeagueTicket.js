const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { buildTicketPanel } = require('../utils/panelBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('refresh-league-ticket')
    .setDescription('Remove o painel antigo e envia um novo painel de inscrições no canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal onde o painel está (ou será enviado)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const canal = interaction.options.getChannel('canal');

    await interaction.deferReply({ ephemeral: true });

    try {
      // Busca mensagens recentes e remove as do bot com botão ticket_open
      const messages = await canal.messages.fetch({ limit: 50 });
      const botPanels = messages.filter(
        m =>
          m.author.id === interaction.client.user.id &&
          m.components?.length > 0 &&
          JSON.stringify(m.components).includes('ticket_open')
      );

      let removed = 0;
      for (const [, msg] of botPanels) {
        await msg.delete().catch(() => {});
        removed++;
        await new Promise(r => setTimeout(r, 300));
      }

      await canal.send(buildTicketPanel());

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🔄 Painel atualizado!')
            .setColor('#00C851')
            .addFields(
              { name: '📌 Canal', value: `<#${canal.id}>`, inline: true },
              { name: '🗑️ Painéis removidos', value: `${removed}`, inline: true },
            )
            .setDescription('O painel de inscrições foi renovado com sucesso.')
            .setTimestamp(),
        ],
      });
    } catch (error) {
      console.error('[refresh-league-ticket] Erro:', error);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro ao atualizar painel')
            .setColor('#FF0000')
            .setDescription(`Ocorreu um erro: ${error.message}`)
            .setTimestamp(),
        ],
      });
    }
  },
};
