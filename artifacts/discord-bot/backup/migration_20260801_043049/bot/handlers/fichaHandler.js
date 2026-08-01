const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const fichaDB = require('../utils/fichaDB');
const { parsePlayer } = require('../utils/parsePlayer');

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false);
const txt = (c) => new TextDisplayBuilder().setContent(c);

// ── Encontra a categoria "Oblivion League" (ou similar) ───────────────────────
function findOblivionCategory(guild) {
  return guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory &&
         c.name.toLowerCase().replace(/[^a-z]/g, '').includes('oblivion')
  ) ?? null;
}

// ── Encontra ou cria o canal #fichas-aprovadas na categoria Oblivion League ───
async function findOrCreateFichasChannel(guild) {
  await guild.channels.fetch().catch(() => {});

  const existing = guild.channels.cache.find(
    c => c.type === ChannelType.GuildText &&
         c.name.toLowerCase().replace(/[^a-z0-9-]/g, '').includes('fichas')
  );
  if (existing) return existing;

  try {
    await guild.roles.fetch().catch(() => {});
    const staffRole  = guild.roles.cache.find(r => r.name.toLowerCase() === 'staff');
    const adminRole  = guild.roles.cache.find(r => r.name.toLowerCase() === 'administrator');
    const categoria  = findOblivionCategory(guild);

    const overwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages] },
    ];
    if (staffRole) overwrites.push({
      id: staffRole.id,
      allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
    });
    if (adminRole) overwrites.push({
      id: adminRole.id,
      allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
    });

    const ch = await guild.channels.create({
      name: 'fichas-aprovadas',
      type: ChannelType.GuildText,
      topic: '📋 Fichas de inscrição aprovadas pela staff da Oblivion League',
      permissionOverwrites: overwrites,
      ...(categoria ? { parent: categoria.id } : {}),
    });
    console.log(`[FICHA] Canal #fichas-aprovadas criado${categoria ? ` na categoria "${categoria.name}"` : ''}: ${ch.id}`);
    return ch;
  } catch (e) {
    console.error('[FICHA] Não foi possível criar #fichas-aprovadas:', e.message);
    return null;
  }
}

// ── Monta containers da ficha para exibição (aprovação/edição) ─────────────────
function buildFichaContainers(row, { status = null } = {}) {
  const statusFinal = status ?? row.status ?? 'PENDENTE';
  const color = statusFinal === 'APROVADA' ? 0x00C851
               : statusFinal === 'REJEITADA' ? 0xFF4444
               : 0xFFA500;
  const emoji = statusFinal === 'APROVADA' ? '✅'
               : statusFinal === 'REJEITADA' ? '❌' : '⏳';

  const jogadores = (row.jogadores ?? []);
  const playerBlock = jogadores.map((p, i) => {
    const tipo = i < 3 ? 'Titular' : 'Reserva';
    return (
      `**P${i + 1}  ·  ${tipo}**\n` +
      `> \`Nick  \`  ${p.nome}\n` +
      `> \`UID   \`  ${p.uid}\n` +
      `> \`TikTok\`  ${p.tiktok}`
    );
  }).join('\n\n');

  const ts = row.criado_em
    ? Math.floor(new Date(row.criado_em).getTime() / 1000)
    : Math.floor(Date.now() / 1000);

  const footer = [];
  if (row.observacoes) footer.push(`📝 **Obs:** ${row.observacoes}`);
  footer.push(`-# 🤖 ${row.registro_id} · Oblivion League`);

  return [
    new ContainerBuilder()
      .setAccentColor(color)
      .addTextDisplayComponents(txt(
        `## 🏆  OBLIVION LEAGUE\n### 📋  Ficha de Inscrição\n\n` +
        `> 🆔  **ID de Registro:** \`${row.registro_id}\`\n` +
        `> 📅  **Recebido em:** <t:${ts}:F>\n` +
        `> 👤  **Solicitante:** <@${row.solicitante_id}>\n` +
        `> ${emoji}  **Status:** \`${statusFinal}\``
      )),

    new ContainerBuilder()
      .setAccentColor(0x5865F2)
      .addTextDisplayComponents(txt(
        `### 🛡️  Dados do Clã\n\n` +
        `> 🏷️  **Clã** · ${row.cla}\n` +
        `> 🔖  **TAG** · \`${row.tag}\`\n` +
        `> ⚔️  **Line** · ${row.line ?? '—'}\n` +
        `> 👤  **Manager** · ${row.manager ?? '—'}\n` +
        `> 🎵  **TikTok** · ${row.tiktok ?? '—'}`
      )),

    new ContainerBuilder()
      .setAccentColor(0x00C851)
      .addTextDisplayComponents(txt(`### 👥  Lineup · ${jogadores.length} jogador(es)`))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(playerBlock || '—'))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(footer.join('\n'))),
  ];
}

// ── 1. Botão ✅ Aprovar ─────────────────────────────────────────────────────────
async function handleAprovarFicha(interaction) {
  const registroId = interaction.customId.split(':')[1];
  if (!registroId) return interaction.reply({ content: '❌ ID inválido.', ephemeral: true });

  // Verificar permissão STAFF
  const member = interaction.member;
  const hasPermission =
    member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    member.roles.cache.some(r => r.name.toLowerCase() === 'staff');

  if (!hasPermission) {
    return interaction.reply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xFF4444)
          .addTextDisplayComponents(txt('### ❌ Sem permissão\n-# Apenas membros da STAFF podem aprovar fichas.')),
      ],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  }

  await interaction.deferUpdate();

  const row = await fichaDB.getById(registroId);
  if (!row) {
    return interaction.followUp({ content: `❌ Ficha \`${registroId}\` não encontrada no banco.`, ephemeral: true });
  }
  if (row.status !== 'PENDENTE') {
    return interaction.followUp({ content: `⚠️ Ficha \`${registroId}\` já está com status **${row.status}**.`, ephemeral: true });
  }

  // Postar no canal #fichas-aprovadas
  const fichasCh = await findOrCreateFichasChannel(interaction.guild);
  let fichasMsgId = null;
  let fichasChId  = null;

  const fichaContainers = buildFichaContainers(row, { status: 'APROVADA' });

  if (fichasCh) {
    try {
      const msg = await fichasCh.send({
        components: fichaContainers,
        flags: MessageFlags.IsComponentsV2,
      });
      fichasMsgId = msg.id;
      fichasChId  = fichasCh.id;
    } catch (e) {
      console.error('[FICHA] Erro ao postar em fichas-aprovadas:', e.message);
    }
  }

  // Atualizar DB
  await fichaDB.aprovar(registroId, interaction.user.id, fichasMsgId, fichasChId);

  // Postar confirmação no ticket
  const approvedAt = Math.floor(Date.now() / 1000);
  await interaction.channel.send({
    components: [
      new ContainerBuilder()
        .setAccentColor(0x00C851)
        .addTextDisplayComponents(txt(
          `### ✅  Ficha Aprovada!\n\n` +
          `**ID:** \`${registroId}\`\n` +
          `**Clã:** ${row.cla} (\`${row.tag}\`)\n` +
          `**Aprovado por:** <@${interaction.user.id}>\n` +
          `**Em:** <t:${approvedAt}:F>\n` +
          (fichasCh ? `\n📌 Ficha arquivada em <#${fichasChId}>` : '') +
          `\n-# 🏆 Bem-vindos à Oblivion League!`
        )),
    ],
    flags: MessageFlags.IsComponentsV2,
  }).catch(() => {});

  // Desabilitar botões na mensagem original
  try {
    const msg = await interaction.fetchReply();
    if (msg?.components) {
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0x00C851)
            .addTextDisplayComponents(txt(`-# ✅ Ficha \`${registroId}\` **APROVADA** por <@${interaction.user.id}>`))
            .addActionRowComponents(
              new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('noop').setLabel('✅ Aprovada').setStyle(ButtonStyle.Success).setDisabled(true),
              )
            ),
        ],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
    }
  } catch (_) {}

  console.log(`[FICHA] Aprovada: ${registroId} por ${interaction.user.tag}`);
}

// ── 2. Botão ❌ Rejeitar → Modal ───────────────────────────────────────────────
async function handleRejeitarFicha(interaction) {
  const registroId = interaction.customId.split(':')[1];
  if (!registroId) return interaction.reply({ content: '❌ ID inválido.', ephemeral: true });

  const member = interaction.member;
  const hasPermission =
    member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    member.roles.cache.some(r => r.name.toLowerCase() === 'staff');

  if (!hasPermission) {
    return interaction.reply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xFF4444)
          .addTextDisplayComponents(txt('### ❌ Sem permissão\n-# Apenas membros da STAFF podem rejeitar fichas.')),
      ],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  }

  const modal = new ModalBuilder()
    .setCustomId(`ficha_rejeicao_submit:${registroId}`)
    .setTitle(`Rejeitar Ficha · ${registroId}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('motivo')
          .setLabel('Motivo da rejeição')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder('Descreva o motivo da rejeição...')
          .setMaxLength(500)
      )
    );

  await interaction.showModal(modal);
}

// ── 3. Modal submit: Rejeição ──────────────────────────────────────────────────
async function handleFichaRejeicaoSubmit(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const registroId = interaction.customId.split(':')[1];
  const motivo     = interaction.fields.getTextInputValue('motivo');

  const row = await fichaDB.getById(registroId);
  if (!row) {
    return interaction.editReply({ content: `❌ Ficha \`${registroId}\` não encontrada.` });
  }

  await fichaDB.rejeitar(registroId, interaction.user.id, motivo);

  const rejectedAt = Math.floor(Date.now() / 1000);
  await interaction.channel.send({
    components: [
      new ContainerBuilder()
        .setAccentColor(0xFF4444)
        .addTextDisplayComponents(txt(
          `### ❌  Ficha Rejeitada\n\n` +
          `**ID:** \`${registroId}\`\n` +
          `**Clã:** ${row.cla} (\`${row.tag}\`)\n` +
          `**Rejeitado por:** <@${interaction.user.id}>\n` +
          `**Em:** <t:${rejectedAt}:F>\n\n` +
          `**Motivo:** ${motivo}\n` +
          `-# ⚠️ O solicitante foi informado neste canal.`
        )),
    ],
    flags: MessageFlags.IsComponentsV2,
  }).catch(() => {});

  await interaction.editReply({
    components: [
      new ContainerBuilder()
        .setAccentColor(0xFF4444)
        .addTextDisplayComponents(txt(`### ❌ Ficha \`${registroId}\` rejeitada.\n-# Motivo registrado no canal do ticket.`)),
    ],
    flags: MessageFlags.IsComponentsV2,
  });

  console.log(`[FICHA] Rejeitada: ${registroId} por ${interaction.user.tag} | Motivo: ${motivo}`);
}

// ── 4. Modal submit: Editar ficha ─────────────────────────────────────────────
async function handleFichaEditarSubmit(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const registroId = interaction.customId.split(':')[1];

  const claTagRaw  = interaction.fields.getTextInputValue('cla_tag');
  const lmRaw      = interaction.fields.getTextInputValue('line_manager');
  const p1Raw      = interaction.fields.getTextInputValue('p1');
  const p23Raw     = interaction.fields.getTextInputValue('p2_p3');
  const obsRaw     = interaction.fields.getTextInputValue('observacoes') || '';

  const claTag  = claTagRaw.split('|').map(s => s.trim());
  const lm      = lmRaw.split('|').map(s => s.trim());

  const p23Lines = p23Raw.split('\n').map(l => l.trim()).filter(Boolean);
  const jogadores = [
    parsePlayer(p1Raw),
    parsePlayer(p23Lines[0]),
    parsePlayer(p23Lines[1]),
  ].filter(Boolean);

  await fichaDB.atualizar(registroId, {
    cla:         claTag[0] ?? undefined,
    tag:         claTag[1] ?? undefined,
    line:        lm[0] || null,
    manager:     lm[1] || null,
    tiktok:      lm[2] || null,
    jogadores:   JSON.stringify(jogadores),
    observacoes: obsRaw || null,
  });

  // Se existe mensagem no canal de fichas, tenta atualizar
  const row = await fichaDB.getById(registroId);
  if (row?.fichas_msg_id && row?.fichas_ch_id) {
    try {
      const ch  = await interaction.guild.channels.fetch(row.fichas_ch_id);
      const msg = await ch.messages.fetch(row.fichas_msg_id);
      await msg.edit({
        components: buildFichaContainers(row, { status: row.status }),
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (e) {
      console.error('[FICHA] Erro ao atualizar mensagem arquivada:', e.message);
    }
  }

  await interaction.editReply({
    components: [
      new ContainerBuilder()
        .setAccentColor(0x00C851)
        .addTextDisplayComponents(txt(
          `### ✅ Ficha Atualizada\n` +
          `**ID:** \`${registroId}\`\n` +
          `-# Dados atualizados com sucesso.`
        )),
    ],
    flags: MessageFlags.IsComponentsV2,
  });

  console.log(`[FICHA] Editada: ${registroId} por ${interaction.user.tag}`);
}

module.exports = {
  buildFichaContainers,
  findOrCreateFichasChannel,
  handleAprovarFicha,
  handleRejeitarFicha,
  handleFichaRejeicaoSubmit,
  handleFichaEditarSubmit,
};
