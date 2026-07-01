const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');

const ROLES_TO_DELETE = ['🌸 Player | Ayasaka', '📋 Manager | Ayasaka'];
const CATS_TO_DELETE  = ['🌸 𝒜𝓎𝒶𝓈𝒶𝓀𝒶 𝒫𝓇𝑜𝓉𝑜𝒸𝑜𝓁', '🎀 𝒯𝓇𝒾𝑜𝓈'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete-ayasaka')
    .setDescription('Apaga tudo que foi criado pelo /setup-ayasaka (2 categorias, canais e cargos)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const log   = [];

    try {
      await guild.channels.fetch();
      await guild.roles.fetch();

      // ── 1. Apagar canais e categorias ──────────────────────────────────────
      log.push('**— Categorias & Canais —**');
      for (const catName of CATS_TO_DELETE) {
        const category = guild.channels.cache.find(
          c => c.type === ChannelType.GuildCategory && c.name === catName
        );

        if (!category) {
          log.push(`⏭️ Categoria não encontrada: **${catName}**`);
          continue;
        }

        const children = guild.channels.cache.filter(c => c.parentId === category.id);
        for (const [, ch] of children) {
          try {
            await ch.delete('Delete Ayasaka Protocol');
            log.push(`  🗑️ Canal apagado: ${ch.name}`);
          } catch (e) {
            log.push(`  ❌ Falha: ${ch.name} — ${e.message}`);
          }
        }

        try {
          await category.delete('Delete Ayasaka Protocol');
          log.push(`🗑️ Categoria apagada: **${catName}**`);
        } catch (e) {
          log.push(`❌ Falha ao apagar categoria: ${e.message}`);
        }
      }

      // ── 2. Apagar cargos ────────────────────────────────────────────────────
      log.push('\n**— Cargos —**');
      for (const roleName of ROLES_TO_DELETE) {
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) { log.push(`⏭️ Cargo não encontrado: **${roleName}**`); continue; }
        try {
          await role.delete('Delete Ayasaka Protocol');
          log.push(`🗑️ Cargo apagado: **${roleName}**`);
        } catch (e) {
          log.push(`❌ Falha ao apagar cargo **${roleName}**: ${e.message}`);
        }
      }

      // ── Resposta ────────────────────────────────────────────────────────────
      const chunks = [];
      let current  = '';
      for (const line of log) {
        if ((current + '\n' + line).length > 3800) { chunks.push(current); current = line; }
        else { current = current ? current + '\n' + line : line; }
      }
      if (current) chunks.push(current);

      const embeds = chunks.map((chunk, i) =>
        new EmbedBuilder()
          .setTitle(i === 0 ? '🗑️ Ayasaka Protocol removido' : null)
          .setColor(0xFF4444)
          .setDescription(chunk)
          .setFooter(i === chunks.length - 1
            ? { text: 'Todas as categorias, canais e cargos do Ayasaka Protocol foram apagados.' }
            : null)
          .setTimestamp(i === chunks.length - 1 ? new Date() : null)
      );

      await interaction.editReply({ embeds });

    } catch (err) {
      console.error('[delete-ayasaka] Erro:', err);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro ao apagar Ayasaka Protocol')
            .setColor(0xFF0000)
            .setDescription(err.code === 50013
              ? 'O bot não tem permissão suficiente. Verifique se o cargo do bot está acima dos cargos que ele está tentando apagar.'
              : err.message)
            .setTimestamp(),
        ],
      });
    }
  },
};
