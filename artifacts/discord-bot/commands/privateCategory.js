const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, OverwriteType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('private-category')
    .setDescription('Deixa categoria visível para todos, mas só o cargo certo pode interagir')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('nome')
        .setDescription('Nome exato da categoria')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName('cargo')
        .setDescription('Cargo que terá acesso total à categoria')
        .setRequired(true)
    ),

  async execute(interaction) {
    const nome = interaction.options.getString('nome');
    const role = interaction.options.getRole('cargo');

    await interaction.deferReply();

    try {
      const channels = await interaction.guild.channels.fetch();
      const category = channels.find(
        c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === nome.toLowerCase()
      );

      if (!category) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ Categoria não encontrada')
              .setColor('#FF0000')
              .setDescription(`Nenhuma categoria com o nome **${nome}** foi encontrada.`)
              .setTimestamp(),
          ],
        });
      }

      await category.permissionOverwrites.set([
        {
          id: interaction.guild.roles.everyone.id,
          type: OverwriteType.Role,
          allow: [PermissionFlagsBits.ViewChannel],
          deny: [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.CreatePrivateThreads,
          ],
        },
        {
          id: role.id,
          type: OverwriteType.Role,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ]);

      const canais = category.children.cache;
      for (const [, channel] of canais) {
        await channel.lockPermissions();
      }

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🔐 Categoria configurada')
            .setColor('#FFA500')
            .setDescription(
              `A categoria **${category.name}** agora é **visível para todos**, mas só <@&${role.id}> pode interagir.`
            )
            .addFields(
              { name: '📁 Categoria', value: category.name, inline: true },
              { name: '👁️ Visível para', value: '@everyone', inline: true },
              { name: '✅ Acesso total', value: `<@&${role.id}>`, inline: true },
              { name: '📺 Canais afetados', value: `${canais.size}`, inline: true },
            )
            .setFooter({ text: 'Bot de Administração' })
            .setTimestamp(),
        ],
      });
    } catch (error) {
      console.error('[private-category] Erro:', error);

      const msg = error.code === 50013
        ? 'O bot não tem permissão para gerenciar canais. Adicione a permissão **Gerenciar Canais** ao bot.'
        : error.message;

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro')
            .setColor('#FF0000')
            .setDescription(msg)
            .setTimestamp(),
        ],
      });
    }
  },
};
