const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  OverwriteType,
} = require('discord.js');

const CATEGORY_NAME = 'League Tickets';
const STAFF_ROLE_NAME = 'STAFF';

// ── Helpers ────────────────────────────────────────────────────────────────

function ticketChannelName(user) {
  return `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

async function findOrCreateCategory(guild) {
  let category = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === CATEGORY_NAME
  );
  if (!category) {
    category = await guild.channels.create({
      name: CATEGORY_NAME,
      type: ChannelType.GuildCategory,
    });
  }
  return category;
}

function buildCloseRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('🔒 Fechar Ticket')
      .setStyle(ButtonStyle.Danger)
  );
}

// ── Open ticket ────────────────────────────────────────────────────────────

async function handleTicketOpen(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const { guild, user } = interaction;
  const chName = ticketChannelName(user);

  await guild.channels.fetch().catch(() => {});

  const duplicate = guild.channels.cache.find(c => c.name === chName);
  if (duplicate) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('⚠️ Ticket já aberto')
          .setColor('#FFA500')
          .setDescription(`Você já tem um ticket aberto: <#${duplicate.id}>\nFinalize-o antes de abrir outro.`)
          .setTimestamp(),
      ],
    });
  }

  await guild.roles.fetch().catch(() => {});
  const staffRole = guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);
  const adminRole = guild.roles.cache.find(r => r.name === 'Administrator');

  const category = await findOrCreateCategory(guild);

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      type: OverwriteType.Role,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: user.id,
      type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  if (staffRole) {
    overwrites.push({
      id: staffRole.id,
      type: OverwriteType.Role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
      ],
    });
  }

  if (adminRole) {
    overwrites.push({
      id: adminRole.id,
      type: OverwriteType.Role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.AttachFiles,
      ],
    });
  }

  const ticketChannel = await guild.channels.create({
    name: chName,
    type: ChannelType.GuildText,
    parent: category.id,
    topic: `Inscrição de ${user.tag} | Aberto em ${new Date().toLocaleDateString('pt-BR')}`,
    permissionOverwrites: overwrites,
  });

  const formEmbed = new EmbedBuilder()
    .setTitle('🏆 Inscrição — Oblivion League')
    .setColor('#FFA500')
    .setDescription(
      `Olá, <@${user.id}>! 👋\n\n` +
      `Preencha as informações abaixo para inscrever seu time na **Oblivion League**.\n` +
      `Nossa equipe revisará sua inscrição em breve.`
    )
    .addFields(
      { name: '🏷️ Nome do Time', value: '> Responda aqui o nome do time', inline: false },
      { name: '🔖 Tag', value: '> Responda aqui a tag (ex: [OBL])', inline: false },
      { name: '👥 Lineup (jogadores titulares)', value: '> Liste os nomes dos jogadores titulares', inline: false },
      { name: '👑 Captain', value: '> Nome do capitão do time', inline: false },
      { name: '🔄 Reservas', value: '> Nome dos jogadores reservas (ou "Nenhum")', inline: false },
      { name: '🆔 UID dos Jogadores', value: '> Cole aqui os UIDs de todos os jogadores', inline: false },
    )
    .setFooter({ text: 'Oblivion League • Sistema de Inscrições' })
    .setTimestamp();

  const staffMention = staffRole ? `<@&${staffRole.id}>` : '@STAFF';

  await ticketChannel.send({
    content: `${staffMention} | Novo ticket de inscrição aberto por <@${user.id}>`,
    embeds: [formEmbed],
    components: [buildCloseRow()],
  });

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle('🎟️ Ticket criado!')
        .setColor('#00C851')
        .setDescription(`Seu ticket foi aberto em <#${ticketChannel.id}>.\nPreencha o formulário e aguarde nosso retorno!`)
        .setTimestamp(),
    ],
  });
}

// ── Close ticket ───────────────────────────────────────────────────────────

async function handleTicketClose(interaction) {
  const channel = interaction.channel;

  if (!channel.name.startsWith('ticket-')) {
    return interaction.reply({
      content: '❌ Este botão só funciona dentro de um canal de ticket.',
      ephemeral: true,
    });
  }

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('🔒 Fechando ticket...')
        .setColor('#FF4444')
        .setDescription(`Ticket encerrado por <@${interaction.user.id}>.\nEste canal será removido em **5 segundos**.`)
        .setTimestamp(),
    ],
  });

  await new Promise(r => setTimeout(r, 5000));

  await channel.delete(`Ticket fechado por ${interaction.user.tag}`).catch(() => {});
}

module.exports = { handleTicketOpen, handleTicketClose };
