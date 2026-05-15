const {
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
  EmbedBuilder,
} = require('discord.js');

const { ticketLogChannelName } = require('../config/config');

const CATEGORY_NAME  = 'League Tickets';
const STAFF_ROLE     = 'STAFF';
const ADMIN_ROLE     = 'Administrator';

// ── Helpers ────────────────────────────────────────────────────────────────

function ticketChannelName(user) {
  return `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

async function findOrCreateCategory(guild) {
  let cat = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === CATEGORY_NAME
  );
  if (!cat) {
    cat = await guild.channels.create({
      name: CATEGORY_NAME,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
      ],
    });
  }
  return cat;
}

function findLogChannel(guild) {
  return guild.channels.cache.find(
    c => c.type === ChannelType.GuildText && c.name.toLowerCase().includes(ticketLogChannelName)
  ) ?? null;
}

// ── Ficha de inscrição ─────────────────────────────────────────────────────

const FICHA = [
  '╭━━━〔 🏆 𝐎𝐁𝐋𝐈𝐕𝐈𝐎𝐍 𝐋𝐄𝐀𝐆𝐔𝐄 〕━━━╮',
  '',
  '📋 𝐅𝐎𝐑𝐌𝐔𝐋𝐀́𝐑𝐈𝐎 𝐃𝐄 𝐈𝐍𝐒𝐂𝐑𝐈𝐂̧𝐀̃𝐎',
  '',
  '• 𝑪𝒍𝒂̃:',
  '• 𝑻𝒂𝒈:',
  '• 𝑳𝒊𝒏𝒆:',
  '• 𝑴𝒂𝒏𝒂𝒈𝒆𝒓:',
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
  '',
  '⚠️ Preencha corretamente todas as informações.',
  '',
  '╰━━━〔 ⚔️ 𝐎𝐁𝐋𝐈𝐕𝐈𝐎𝐍 〕━━━╯',
].join('\n');

// ── Builders de container ──────────────────────────────────────────────────

function buildTicketContainer(user, staffMention) {
  return new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎟️ Novo Ticket de Inscrição\n` +
        `**Solicitante:** <@${user.id}> \`${user.tag}\`\n` +
        `**Aberto em:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
        `-# ${staffMention} — nova inscrição recebida.`
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `📋 **Copie a ficha abaixo, preencha e envie neste canal.**`
      )
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('```\n' + FICHA + '\n```')
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('🔒 Fechar Ticket')
          .setStyle(ButtonStyle.Danger)
      )
    );
}

function buildConfirmContainer() {
  return new ContainerBuilder()
    .setAccentColor(0xFF4444)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⚠️ Confirmar fechamento\n` +
        `Tem certeza que deseja fechar este ticket?\n` +
        `-# O canal será deletado permanentemente.`
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_close_confirm')
          .setLabel('✅ Confirmar')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('ticket_close_cancel')
          .setLabel('❌ Cancelar')
          .setStyle(ButtonStyle.Secondary)
      )
    );
}

// ── Open ticket ────────────────────────────────────────────────────────────

async function handleTicketOpen(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const { guild, user } = interaction;
  const chName = ticketChannelName(user);

  await guild.channels.fetch().catch(() => {});

  // Anti-duplicação
  const duplicate = guild.channels.cache.find(c => c.name === chName);
  if (duplicate) {
    return interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xFFA500)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### ⚠️ Ticket já aberto\n` +
              `Você já tem um ticket ativo: <#${duplicate.id}>\n` +
              `-# Preencha o formulário ou aguarde o retorno do STAFF.`
            )
          ),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  await guild.roles.fetch().catch(() => {});
  const staffRole = guild.roles.cache.find(r => r.name === STAFF_ROLE);
  const adminRole = guild.roles.cache.find(r => r.name === ADMIN_ROLE);

  const category = await findOrCreateCategory(guild);

  // ── Permissões: usuário + STAFF + Administrator ───────────────────────
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

  const staffMention = staffRole ? `<@&${staffRole.id}>` : '@STAFF';

  await ticketChannel.send({
    components: [buildTicketContainer(user, staffMention)],
    flags: MessageFlags.IsComponentsV2,
  });

  // Confirmação ephemeral para o jogador
  await interaction.editReply({
    components: [
      new ContainerBuilder()
        .setAccentColor(0x00C851)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ✅ Ticket criado!\n` +
            `Seu ticket foi aberto em <#${ticketChannel.id}>.\n` +
            `Copie a ficha, preencha e envie no canal.\n` +
            `-# Nossa equipe analisará sua inscrição em breve.`
          )
        ),
    ],
    flags: MessageFlags.IsComponentsV2,
  });
}

// ── Close ticket (pede confirmação) ───────────────────────────────────────

async function handleTicketClose(interaction) {
  if (!interaction.channel.name.startsWith('ticket-')) {
    return interaction.reply({ content: '❌ Este botão só funciona dentro de um ticket.', ephemeral: true });
  }

  await interaction.reply({
    components: [buildConfirmContainer()],
    flags: MessageFlags.IsComponentsV2,
    ephemeral: true,
  });
}

// ── Close confirm (envia log + deleta) ────────────────────────────────────

async function handleTicketCloseConfirm(interaction) {
  const channel = interaction.channel;

  if (!channel.name.startsWith('ticket-')) {
    return interaction.reply({ content: '❌ Canal inválido.', ephemeral: true });
  }

  await interaction.deferUpdate();

  const closedAt = Math.floor(Date.now() / 1000);
  const closedBy = interaction.user;
  const topic    = channel.topic ?? 'Sem informações';

  // ── Envia log no canal de staff-logs ─────────────────────────────────
  const logChannel = findLogChannel(interaction.guild);
  if (logChannel) {
    await logChannel.send({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xFF4444)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### 📁 Ticket Encerrado\n` +
              `**Canal:** \`${channel.name}\`\n` +
              `**Tópico:** ${topic}\n` +
              `**Fechado por:** <@${closedBy.id}> \`${closedBy.tag}\`\n` +
              `**Fechado em:** <t:${closedAt}:F>`
            )
          ),
      ],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => {});
  }

  // ── Avisa no canal antes de deletar ───────────────────────────────────
  await channel.send({
    components: [
      new ContainerBuilder()
        .setAccentColor(0xFF4444)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🔒 Ticket Encerrado\n` +
            `Fechado por <@${closedBy.id}> em <t:${closedAt}:F>.\n` +
            `-# Este canal será removido em **5 segundos**.`
          )
        ),
    ],
    flags: MessageFlags.IsComponentsV2,
  }).catch(() => {});

  await new Promise(r => setTimeout(r, 5000));
  await channel.delete(`Ticket fechado por ${closedBy.tag}`).catch(() => {});
}

// ── Close cancel ──────────────────────────────────────────────────────────

async function handleTicketCloseCancel(interaction) {
  await interaction.update({
    components: [
      new ContainerBuilder()
        .setAccentColor(0x5865F2)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ❌ Cancelado\nO ticket continua aberto.`
          )
        ),
    ],
    flags: MessageFlags.IsComponentsV2,
  });
}

module.exports = {
  handleTicketOpen,
  handleTicketClose,
  handleTicketCloseConfirm,
  handleTicketCloseCancel,
};
