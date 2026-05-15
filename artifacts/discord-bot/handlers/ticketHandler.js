const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  OverwriteType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
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
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          type: OverwriteType.Role,
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ],
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
          .setDescription(`Você já tem um ticket em análise pelo STAFF.\nAguarde o retorno da equipe.`)
          .setTimestamp(),
      ],
    });
  }

  await guild.roles.fetch().catch(() => {});
  const staffRole = guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);
  const adminRole = guild.roles.cache.find(r => r.name === 'Administrator');

  const category = await findOrCreateCategory(guild);

  // ── Apenas STAFF e Administrator têm acesso ───────────────────────────
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      type: OverwriteType.Role,
      deny: [PermissionFlagsBits.ViewChannel],
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
        PermissionFlagsBits.EmbedLinks,
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
        PermissionFlagsBits.EmbedLinks,
      ],
    });
  }

  const ticketChannel = await guild.channels.create({
    name: chName,
    type: ChannelType.GuildText,
    parent: category.id,
    topic: `Inscrição de ${user.tag} (${user.id}) | ${new Date().toLocaleDateString('pt-BR')}`,
    permissionOverwrites: overwrites,
  });

  // ── Ficha de inscrição ────────────────────────────────────────────────
  const ficha = [
    '╔════════════════════╗',
    '      🏆 𝐎𝐁𝐋𝐈𝐕𝐈𝐎𝐍 𝐋𝐄𝐀𝐆𝐔𝐄 🏆',
    '╚════════════════════╝',
    '',
    '✦ 𝑪𝒍𝒂̃:',
    '✦ 𝑻𝒂𝒈:',
    '✦ 𝑳𝒊𝒏𝒆:',
    '✦ 𝑴𝒂𝒏𝒂𝒈𝒆𝒓:',
    '',
    '━━━━━━━━━━━━━━━━━━',
    '',
    '𝗣𝟭:',
    '𝗨𝗜𝗗:',
    '',
    '𝗣𝟮:',
    '𝗨𝗜𝗗:',
    '',
    '𝗣𝟯:',
    '𝗨𝗜𝗗:',
    '',
    '𝗣𝟰:',
    '𝗨𝗜𝗗:',
    '',
    '𝗣𝟱:',
    '𝗨𝗜𝗗:',
    '',
    '━━━━━━━━━━━━━━━━━━',
  ].join('\n');

  // ── Container V2 ──────────────────────────────────────────────────────
  const staffMention = staffRole ? `<@&${staffRole.id}>` : '@STAFF';

  const container = new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎟️ Novo Ticket de Inscrição\n` +
        `**Jogador:** <@${user.id}> \`(${user.tag})\`\n` +
        `**Aberto em:** <t:${Math.floor(Date.now() / 1000)}:F>`
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# Preencha a ficha abaixo e cole neste canal.`
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('```\n' + ficha + '\n```')
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addActionRowComponents(buildCloseRow());

  await ticketChannel.send({
    content: `${staffMention} | Ticket de inscrição de **${user.tag}**`,
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });

  // ── Confirmar ao jogador (ephemeral) ──────────────────────────────────
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle('🎟️ Inscrição recebida!')
        .setColor('#00C851')
        .setDescription(
          `Sua solicitação de inscrição foi enviada ao **STAFF** da Oblivion League.\n\n` +
          `Aguarde o contato da nossa equipe. ✅`
        )
        .setFooter({ text: 'Oblivion League • Sistema de Inscrições' })
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

  const closeContainer = new ContainerBuilder()
    .setAccentColor(0xFF4444)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔒 Ticket Encerrado\n` +
        `Fechado por <@${interaction.user.id}> em <t:${Math.floor(Date.now() / 1000)}:F>.\n` +
        `-# Este canal será removido em **5 segundos**.`
      )
    );

  await interaction.reply({
    components: [closeContainer],
    flags: MessageFlags.IsComponentsV2,
  });

  await new Promise(r => setTimeout(r, 5000));
  await channel.delete(`Ticket fechado por ${interaction.user.tag}`).catch(() => {});
}

module.exports = { handleTicketOpen, handleTicketClose };
