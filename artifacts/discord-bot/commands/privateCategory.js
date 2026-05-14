const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, OverwriteType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('private-category')
    .setDescription('Torna uma categoria privada (invisível para membros sem cargo)')
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
        .setDescription('Cargo que terá acesso à categoria (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const nome = interaction.options.getString('nome');
    const roleAllow = interaction.options.getRole('cargo');

    await interaction.deferReply();

    try {
      const categories = await interaction.guild.channels.fetch();
      const category = categories.find(
        c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === nome.toLowerCase()
      );

      if (!category) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Categoria não encontrada')
          .setColor('#FF0000')
          .setDescription(`Nenhuma categoria com o nome **${nome}** foi encontrada.\nVerifique o nome e tente novamente.`)
          .setTimestamp();

        return interaction.editReply({ embeds: [errorEmbed] });
      }

      await category.permissionOverwrites.set([
        {
          id: interaction.guild.roles.everyone.id,
          type: OverwriteType.Role,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        ...(roleAllow
          ? [{
              id: roleAllow.id,
              type: OverwriteType.Role,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
            }]
          : []),
      ]);

      const canais = category.children.cache;
      for (const [, channel] of canais) {
        await channel.lockPermissions();
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('🔒 Categoria tornada privada')
        .setColor('#FFA500')
        .addFields(
          { name: '📁 Categoria', value: category.name, inline: true },
          { name: '📺 Canais afetados', value: `${canais.size}`, inline: true },
          {
            name: '🔓 Acesso liberado para',
            value: roleAllow ? `<@&${roleAllow.id}>` : 'Nenhum cargo específico',
            inline: true,
          },
        )
        .setDescription('@everyone não pode mais ver esta categoria.')
        .setFooter({ text: 'Bot de Administração' })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      console.error('[private-category] Erro:', error);

      const msg = error.code === 50013
        ? 'O bot não tem permissão para gerenciar canais. Certifique-se que o bot possui a permissão **Gerenciar Canais**.'
        : error.message;

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Erro ao tornar categoria privada')
        .setColor('#FF0000')
        .setDescription(msg)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
