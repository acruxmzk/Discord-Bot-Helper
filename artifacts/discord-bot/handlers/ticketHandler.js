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

const { findLogChannel, notifyBanDetected } = require('../utils/staffAlert');
const banDB  = require('../utils/banDB');
const fichaDB = require('../utils/fichaDB');

const CATEGORY_NAME = 'League Tickets';
const STAFF_ROLE    = 'STAFF';
const ADMIN_ROLE    = 'Administrator';

// ── UI helpers ────────────────────────────────────────────────────────────────
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

// ── Container de boas-vindas do ticket ────────────────────────────────────────
function buildWelcomeContainer(user, staffMention) {
  const agora = Math.floor(Date.now() / 1000);
  return new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(txt(
      `### 🎟️  Ticket de Inscrição\n` +
      `-# ${staffMention} — nova inscrição recebida`
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      `👤  **Solicitante:** <@${user.id}>\n` +
      `🕐  **Aberto em:** <t:${Math.floor(Date.now() / 1000)}:F>`
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '### 📋  Instruções\n\n' +
      '**1.** Clique em **📝 Preencher Ficha** abaixo\n' +
      '**2.** Preencha o formulário com os dados do clã e UIDs\n' +
      '**3.** Envie e aguarde a análise da staff\n\n' +
      '-# ⚠️ Preencha todos os campos corretamente ou sua inscrição pode ser invalidada.'
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
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
  const category  = await findOrCreateCategory(guild);

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
          `Seu ticket foi aberto: <#${ticketChannel.id}>\n` +
          `Clique em **📝 Preencher Ficha** dentro do canal.\n` +
          `-# Nossa equipe analisará em breve.`
        )),
    ],
    flags: MessageFlags.IsComponentsV2,
  });
}

// ── 2. Botão "Preencher Ficha" → Modal ────────────────────────────────────────
async function handleFormOpen(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('form_inscricao')
    .setTitle('📋 Inscrição — Oblivion League')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('cla_tag')
          .setLabel('Nome do Clã  e  TAG')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('Oblivion | OBL')
          .setMaxLength(60)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('line_manager')
          .setLabel('Line  ·  Manager  ·  TikTok')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('Line 1 | NomeManager | @tiktokcla')
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('p1')
          .setLabel('Jogador 1 — Titular  (Nick | UID | @TikTok)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('NickIngame | 1234567890 | @tiktoknick')
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('p2_p3')
          .setLabel('Titulares 2 e 3  (Nick | UID | @TikTok)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder('NickP2 | 1234567890 | @tiktokp2\nNickP3 | 1234567890 | @tiktokp3')
          .setMaxLength(300)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('p4_p5')
          .setLabel('Reservas 4 e 5  (Nick | UID | @TikTok)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setPlaceholder('NickP4 | 1234567890 | @tiktokp4\nNickP5 | 1234567890 | @tiktokp5  (opcional)')
          .setMaxLength(300)
      ),
    );
  await interaction.showModal(modal);
}

// ── 3. Modal submit → processa ficha, salva no DB ─────────────────────────────
async function handleFormInscricao(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // ── Parse clã ────────────────────────────────────────────────────────────
  const claTagRaw      = interaction.fields.getTextInputValue('cla_tag');
  const claTagParts    = claTagRaw.split('|').map(s => s.trim());
  const cla            = claTagParts[0] || '—';
  const tag            = claTagParts[1] || '—';

  const lineManagerRaw   = interaction.fields.getTextInputValue('line_manager');
  const lineManagerParts = lineManagerRaw.split('|').map(s => s.trim());
  const line    = lineManagerParts[0] || '—';
  const manager = lineManagerParts[1] || '—';
  const tiktok  = lineManagerParts[2] || '—';

  // ── Parse jogadores ───────────────────────────────────────────────────────
  function parsePlayer(raw) {
    if (!raw || !raw.trim()) return null;
    const parts    = raw.split('|').map(s => s.trim());
    const nome     = parts[0] || '—';
    const uidMatch = raw.match(/\d{6,20}/);
    const uid      = uidMatch ? uidMatch[0] : (parts[1] || '—');
    const tk       = parts[2] || '—';
    return { nome, uid, tiktok: tk };
  }

  const p1raw   = interaction.fields.getTextInputValue('p1');
  const p23raw  = interaction.fields.getTextInputValue('p2_p3');
  const p45raw  = interaction.fields.getTextInputValue('p4_p5') || '';

  const p23lines = p23raw.split('\n').map(l => l.trim()).filter(Boolean);
  const p45lines = p45raw.split('\n').map(l => l.trim()).filter(Boolean);

  const players = [
    parsePlayer(p1raw),
    parsePlayer(p23lines[0] || null),
    parsePlayer(p23lines[1] || null),
    parsePlayer(p45lines[0] || null),
    parsePlayer(p45lines[1] || null),
  ].filter(Boolean);

  // ── ID de registro único ──────────────────────────────────────────────────
  const agora      = Math.floor(Date.now() / 1000);
  const datePart   = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randPart   = Math.random().toString(36).slice(2, 6).toUpperCase();
  const registroId = `OBL-${datePart}-${randPart}`;

  // ── Blocos de jogadores ───────────────────────────────────────────────────
  const tipoLabel  = ['Titular', 'Titular', 'Titular', 'Reserva', 'Reserva'];
  const playerBlock = players.map((p, i) => {
    const tipo = tipoLabel[i] ?? 'Titular';
    return (
      `**P${i + 1}  ·  ${tipo}**\n` +
      `> \`Nick  \`  ${p.nome}\n` +
      `> \`UID   \`  ${p.uid}\n` +
      `> \`TikTok\`  ${p.tiktok}`
    );
  }).join('\n\n');

  const totalLabel = `${players.length} jogador${players.length !== 1 ? 'es' : ''}`;

  // ── Salvar no banco de dados ──────────────────────────────────────────────
  await fichaDB.saveInscricao({
    registroId,
    guildId:       interaction.guild.id,
    solicitanteId: interaction.user.id,
    cla, tag, line, manager, tiktok,
    jogadores:     players,
    ticketChannelId: interaction.channel.id,
  }).catch(e => console.error('[FORM] Erro ao salvar ficha no DB:', e.message));

  // ── Posta a ficha + botões de aprovação no canal ──────────────────────────
  const channel = interaction.channel;

  await channel.send({
    components: [
      new ContainerBuilder()
        .setAccentColor(0xFFAA00)
        .addTextDisplayComponents(txt(
          `## 🏆  OBLIVION LEAGUE\n` +
          `### 📋  Ficha de Inscrição\n\n` +
          `> 🆔  **ID de Registro:** \`${registroId}\`\n` +
          `> 📅  **Recebido em:** <t:${agora}:F>\n` +
          `> 👤  **Solicitante:** <@${interaction.user.id}>`
        )),

      new ContainerBuilder()
        .setAccentColor(0x5865F2)
        .addTextDisplayComponents(txt(
          `### 🛡️  Dados do Clã\n\n` +
          `> 🏷️  **Clã** · ${cla}\n` +
          `> 🔖  **TAG** · \`${tag}\`\n` +
          `> ⚔️  **Line** · ${line}\n` +
          `> 👤  **Manager** · ${manager}\n` +
          `> 🎵  **TikTok** · ${tiktok}`
        )),

      new ContainerBuilder()
        .setAccentColor(0x00C851)
        .addTextDisplayComponents(txt(`### 👥  Lineup · ${totalLabel}`))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(txt(playerBlock))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(txt(
          `> ⏳  **Status:** \`PENDENTE DE ANÁLISE\`\n` +
          `-# 🤖 Registro automático · ${registroId} · Sistema OBL`
        )),

      new ContainerBuilder()
        .setAccentColor(0x9B59B6)
        .addTextDisplayComponents(txt(`### ⚖️  Decisão da Staff`))
        .addSeparatorComponents(gap())
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`ficha_aprovar:${registroId}`)
              .setLabel('✅ Aprovar Ficha')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`ficha_rejeitar:${registroId}`)
              .setLabel('❌ Rejeitar')
              .setStyle(ButtonStyle.Danger),
          )
        ),
    ],
    flags: MessageFlags.IsComponentsV2,
  }).catch(e => console.error('[FORM] Erro ao postar ficha:', e.message));

  // ── Verificação de bans ───────────────────────────────────────────────────
  const uids = players.map(p => p.uid).filter(u => /^\d{6,20}$/.test(u));
  const banResults = await Promise.all(
    uids.map(async uid => ({ uid, result: await banDB.checkPlayer(uid) }))
  );
  const banidos = banResults.filter(({ result }) => result.status === 'BANIDO');

  console.log(`[FORM] ${interaction.user.tag} | UIDs: [${uids.join(', ')}] | Banidos: [${banidos.map(b => b.uid).join(', ') || 'nenhum'}]`);

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
          `Sua inscrição foi registrada com ID \`${registroId}\`.\n` +
          `-# Aguarde o retorno da staff.`
        )),
    ],
    flags: MessageFlags.IsComponentsV2,
  });
}

// ── 4. Fechar ticket ──────────────────────────────────────────────────────────
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

// ── 5. Confirmar fechamento ───────────────────────────────────────────────────
async function handleTicketCloseConfirm(interaction) {
  const channel = interaction.channel;
  if (!channel.name.startsWith('ticket-')) {
    return interaction.reply({ content: '❌ Canal inválido.', ephemeral: true });
  }

  await interaction.deferUpdate();

  const closedAt = Math.floor(Date.now() / 1000);
  const closedBy = interaction.user;
  const logCh    = findLogChannel(interaction.guild);

  if (logCh) {
    await logCh.send({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xFF4444)
          .addTextDisplayComponents(txt(
            `### 📁 Ticket Encerrado\n` +
            `**Canal:** \`${channel.name}\`\n` +
            `**Tópico:** ${channel.topic ?? 'Sem informações'}\n` +
            `**Fechado por:** <@${closedBy.id}>\n` +
            `**Em:** <t:${closedAt}:F>`
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
  await channel.delete().catch(() => {});
}

// ── 6. Cancelar fechamento ────────────────────────────────────────────────────
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
  handleFormInscricao,
  handleTicketClose,
  handleTicketCloseConfirm,
  handleTicketCloseCancel,
};
