const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  OverwriteType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

const { findLogChannel, getStaffMention } = require('../utils/staffAlert');
const { notifyBanDetected }               = require('../utils/staffAlert');
const { checkPlayer }                     = require('../utils/banDB');

const CATEGORY_NAME = 'League Tickets';
const STAFF_ROLE    = 'STAFF';
const ADMIN_ROLE    = 'Administrator';

// ── Estado temporário entre modais (Modal 1 → Modal 2) ────────────────────────
const pendingFormData = new Map(); // userId → { cla, tag, line, manager }

// ── Helpers UI ────────────────────────────────────────────────────────────────
function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function gap() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

// ── Infra ─────────────────────────────────────────────────────────────────────
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

// ── Containers de boas-vindas do ticket ───────────────────────────────────────
function buildWelcomeContainer(user, staffMention) {
  return new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(txt(
      `### 🎟️  Ticket de Inscrição\n` +
      `**Solicitante:** <@${user.id}> \`${user.tag}\`\n` +
      `**Aberto em:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
      `-# ${staffMention} — nova inscrição recebida.`
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '📋 Clique em **Preencher Ficha** para iniciar sua inscrição.\n' +
      '-# Você precisará informar os dados do clã e os UIDs de cada jogador.'
    ))
    .addSeparatorComponents(gap())
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('form_open')
          .setLabel('📝 Preencher Ficha')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('🔒 Fechar Ticket')
          .setStyle(ButtonStyle.Danger),
      )
    );
}

function buildConfirmContainer() {
  return new ContainerBuilder()
    .setAccentColor(0xFF4444)
    .addTextDisplayComponents(txt(
      `### ⚠️ Confirmar fechamento\n` +
      `Tem certeza que deseja fechar este ticket?\n` +
      `-# O canal será deletado permanentemente.`
    ))
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_close_confirm')
          .setLabel('✅ Confirmar')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('ticket_close_cancel')
          .setLabel('❌ Cancelar')
          .setStyle(ButtonStyle.Secondary),
      )
    );
}

// ── 1. Abrir ticket ───────────────────────────────────────────────────────────
async function handleTicketOpen(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const { guild, user } = interaction;
  const chName = ticketChannelName(user);

  await guild.channels.fetch().catch(() => {});

  const duplicate = guild.channels.cache.find(c => c.name === chName);
  if (duplicate) {
    return interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xFFA500)
          .addTextDisplayComponents(txt(
            `### ⚠️ Ticket já aberto\n` +
            `Você já tem um ticket ativo: <#${duplicate.id}>\n` +
            `-# Preencha o formulário ou aguarde o retorno do STAFF.`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  await guild.roles.fetch().catch(() => {});
  const staffRole = guild.roles.cache.find(r => r.name === STAFF_ROLE);
  const adminRole = guild.roles.cache.find(r => r.name === ADMIN_ROLE);

  const category = await findOrCreateCategory(guild);

  const overwrites = [
    { id: guild.roles.everyone.id, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: user.id, type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];
  if (staffRole) overwrites.push({
    id: staffRole.id, type: OverwriteType.Role,
    allow: [
      PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks,
    ],
  });
  if (adminRole) overwrites.push({
    id: adminRole.id, type: OverwriteType.Role,
    allow: [
      PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ManageChannels, PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
    ],
  });

  const ticketChannel = await guild.channels.create({
    name: chName,
    type: ChannelType.GuildText,
    parent: category.id,
    topic: `Inscrição de ${user.tag} (${user.id}) | ${new Date().toLocaleDateString('pt-BR')}`,
    permissionOverwrites: overwrites,
  });

  const staffMention = staffRole ? `<@&${staffRole.id}>` : '@STAFF';
  await ticketChannel.send({
    components: [buildWelcomeContainer(user, staffMention)],
    flags: MessageFlags.IsComponentsV2,
  });

  await interaction.editReply({
    components: [
      new ContainerBuilder()
        .setAccentColor(0x00C851)
        .addTextDisplayComponents(txt(
          `### ✅ Ticket criado!\n` +
          `Seu ticket foi aberto em <#${ticketChannel.id}>.\n` +
          `Clique em **Preencher Ficha** para iniciar sua inscrição.\n` +
          `-# Nossa equipe analisará em breve.`
        )),
    ],
    flags: MessageFlags.IsComponentsV2,
  });
}

// ── 2. Botão "Preencher Ficha" → Modal 1 (Clã) ───────────────────────────────
async function handleFormOpen(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('form_cla')
    .setTitle('Inscrição — Dados do Clã')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('cla')
          .setLabel('Nome do Clã')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(50)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('tag')
          .setLabel('TAG do Clã')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(10)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('line')
          .setLabel('Line (ex: Line 1)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(20)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('manager')
          .setLabel('Manager (responsável pelo clã)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(50)
      ),
    );
  await interaction.showModal(modal);
}

// ── 3. Modal 1 submit → armazena dados, abre Modal 2 (Jogadores) ──────────────
async function handleFormCla(interaction) {
  pendingFormData.set(interaction.user.id, {
    cla:     interaction.fields.getTextInputValue('cla').trim(),
    tag:     interaction.fields.getTextInputValue('tag').trim(),
    line:    interaction.fields.getTextInputValue('line').trim(),
    manager: interaction.fields.getTextInputValue('manager').trim(),
  });

  const modal = new ModalBuilder()
    .setCustomId('form_jogadores')
    .setTitle('Inscrição — Jogadores (Nome | UID)')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('p1')
          .setLabel('Jogador 1 — Nome | UID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('Ex: NomeIngame | 1234567890')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('p2')
          .setLabel('Jogador 2 — Nome | UID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('Ex: NomeIngame | 1234567890')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('p3')
          .setLabel('Jogador 3 — Nome | UID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('Ex: NomeIngame | 1234567890')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('p4')
          .setLabel('Jogador 4 — Nome | UID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('Ex: NomeIngame | 1234567890')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('p5')
          .setLabel('Jogador 5 — Nome | UID (Reserva, opcional)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('Ex: NomeIngame | 1234567890')
      ),
    );
  await interaction.showModal(modal);
}

// ── 4. Modal 2 submit → processa tudo ────────────────────────────────────────
async function handleFormJogadores(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const claData   = pendingFormData.get(interaction.user.id) ?? {};
  pendingFormData.delete(interaction.user.id);

  // ── Parsear jogadores ─────────────────────────────────────────────────────
  function parsePlayer(raw) {
    if (!raw || !raw.trim()) return null;
    // Aceita: "Nome | UID", "Nome, UID", "Nome UID"
    const parts = raw.split(/[|,]/).map(p => p.trim());
    const nome  = parts[0] || '—';
    // UID = primeiro bloco de dígitos encontrado
    const uidMatch = raw.match(/\d{6,20}/);
    const uid  = uidMatch ? uidMatch[0] : (parts[1] ?? '—');
    return { nome, uid };
  }

  const rawPlayers = ['p1', 'p2', 'p3', 'p4', 'p5']
    .map(k => { try { return interaction.fields.getTextInputValue(k); } catch { return null; } });

  const players = rawPlayers.map(parsePlayer).filter(Boolean);

  // ── Formatação da ficha ───────────────────────────────────────────────────
  const playerLines = players.map((p, i) =>
    `𝗣${i + 1}: ${p.nome}\n𝗨𝗜𝗗: ${p.uid}`
  ).join('\n\n');

  const fichaTexto = [
    '╭━━━〔 🏆 𝐎𝐁𝐋𝐈𝐕𝐈𝐎𝐍 𝐋𝐄𝐀𝐆𝐔𝐄 〕━━━╮',
    '',
    '📋 𝐅𝐎𝐑𝐌𝐔𝐋𝐀́𝐑𝐈𝐎 𝐃𝐄 𝐈𝐍𝐒𝐂𝐑𝐈𝐂̧𝐀̃𝐎',
    '',
    `• 𝑪𝒍𝒂̃: ${claData.cla ?? '—'}`,
    `• 𝑻𝒂𝒈: ${claData.tag ?? '—'}`,
    `• 𝑳𝒊𝒏𝒆: ${claData.line ?? '—'}`,
    `• 𝑴𝒂𝒏𝒂𝒈𝒆𝒓: ${claData.manager ?? '—'}`,
    '',
    '━━━━━━━━━━━━━━━━━━',
    '',
    playerLines,
    '',
    '━━━━━━━━━━━━━━━━━━',
    '',
    '╰━━━〔 ⚔️ 𝐎𝐁𝐋𝐈𝐕𝐈𝐎𝐍 〕━━━╯',
  ].join('\n');

  // ── Posta ficha no canal do ticket ────────────────────────────────────────
  const channel = interaction.channel;
  await channel.send({
    components: [
      new ContainerBuilder()
        .setAccentColor(0xFFA500)
        .addTextDisplayComponents(txt(
          `### 📋  Ficha de Inscrição\n` +
          `**Enviado por:** <@${interaction.user.id}>  ·  <t:${Math.floor(Date.now() / 1000)}:F>`
        ))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(txt('```\n' + fichaTexto + '\n```'))
        .addSeparatorComponents(gap())
        .addTextDisplayComponents(txt('-# Aguarde a análise da staff. ✅')),
    ],
    flags: MessageFlags.IsComponentsV2,
  }).catch(e => console.error('[TICKET] Falha ao postar ficha:', e.message));

  // ── Verificação de bans ───────────────────────────────────────────────────
  const uids   = players.map(p => p.uid).filter(u => /^\d{6,20}$/.test(u));
  const banidos = uids
    .map(uid => ({ uid, result: checkPlayer(uid) }))
    .filter(({ result }) => result.status === 'BANIDO');

  console.log(`[TICKET-FORM] ${interaction.user.tag} | UIDs: [${uids.join(', ')}] | Banidos: [${banidos.map(b => b.uid).join(', ') || 'nenhum'}]`);

  if (banidos.length > 0) {
    await notifyBanDetected({
      guild:         interaction.guild,
      ticketChannel: channel,
      sender:        interaction.user,
      banidos,
    });
  }

  // ── Confirmação ephemeral ─────────────────────────────────────────────────
  await interaction.editReply({
    components: [
      new ContainerBuilder()
        .setAccentColor(0x00C851)
        .addTextDisplayComponents(txt(
          `### ✅ Ficha enviada!\n` +
          `Sua inscrição foi registrada no ticket.\n` +
          `-# A staff analisará em breve.`
        )),
    ],
    flags: MessageFlags.IsComponentsV2,
  });
}

// ── 5. Fechar ticket (confirmação) ────────────────────────────────────────────
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

// ── 6. Confirmar fechamento ───────────────────────────────────────────────────
async function handleTicketCloseConfirm(interaction) {
  const channel  = interaction.channel;
  if (!channel.name.startsWith('ticket-')) {
    return interaction.reply({ content: '❌ Canal inválido.', ephemeral: true });
  }

  await interaction.deferUpdate();

  const closedAt = Math.floor(Date.now() / 1000);
  const closedBy = interaction.user;
  const topic    = channel.topic ?? 'Sem informações';

  const logCh = findLogChannel(interaction.guild);
  if (logCh) {
    await logCh.send({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xFF4444)
          .addTextDisplayComponents(txt(
            `### 📁 Ticket Encerrado\n` +
            `**Canal:** \`${channel.name}\`\n` +
            `**Tópico:** ${topic}\n` +
            `**Fechado por:** <@${closedBy.id}> \`${closedBy.tag}\`\n` +
            `**Fechado em:** <t:${closedAt}:F>`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => {});
  }

  await channel.send({
    components: [
      new ContainerBuilder()
        .setAccentColor(0xFF4444)
        .addTextDisplayComponents(txt(
          `### 🔒 Ticket Encerrado\n` +
          `Fechado por <@${closedBy.id}> em <t:${closedAt}:F>.\n` +
          `-# Este canal será removido em **5 segundos**.`
        )),
    ],
    flags: MessageFlags.IsComponentsV2,
  }).catch(() => {});

  await new Promise(r => setTimeout(r, 5000));
  await channel.delete(`Ticket fechado por ${closedBy.tag}`).catch(() => {});
}

// ── 7. Cancelar fechamento ────────────────────────────────────────────────────
async function handleTicketCloseCancel(interaction) {
  await interaction.update({
    components: [
      new ContainerBuilder()
        .setAccentColor(0x5865F2)
        .addTextDisplayComponents(txt(`### ❌ Cancelado\nO ticket continua aberto.`)),
    ],
    flags: MessageFlags.IsComponentsV2,
  });
}

module.exports = {
  handleTicketOpen,
  handleFormOpen,
  handleFormCla,
  handleFormJogadores,
  handleTicketClose,
  handleTicketCloseConfirm,
  handleTicketCloseCancel,
};
