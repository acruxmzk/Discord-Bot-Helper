const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  OverwriteType,
} = require('discord.js');

// ── Definições de cargos ───────────────────────────────────────────────────────
const ROLES_DEF = [
  { name: '🌸 Player | Ayasaka',  color: 0xFF69B4, hoist: true },
  { name: '📋 Manager | Ayasaka', color: 0xB983FF, hoist: true },
];

// ── Canais de texto da categoria principal ─────────────────────────────────────
const MAIN_CHANNELS = [
  '📜┃regras',
  '📢┃anúncios',
  '👥┃lineups',
  '🏆┃resultados',
  '💬┃chat',
  '🎫┃suporte',
  '📝┃inscrição',
];

// ── Canais privados de trio (texto) ────────────────────────────────────────────
const TRIO_TEXT = Array.from({ length: 25 }, (_, i) => `💗┃trio-${String(i + 1).padStart(2, '0')}`);

// ── Canais de voz ──────────────────────────────────────────────────────────────
const TRIO_VOICE = Array.from({ length: 25 }, (_, i) => `🎀 Trio ${String(i + 1).padStart(2, '0')}`);

// ── Helper: criar ou reutilizar cargo ─────────────────────────────────────────
async function upsertRole(guild, def) {
  const existing = guild.roles.cache.find(r => r.name === def.name);
  if (existing) return { role: existing, created: false };
  const role = await guild.roles.create({
    name:        def.name,
    color:       def.color,
    hoist:       def.hoist,
    mentionable: true,
    reason:      'Setup Ayasaka Protocol',
  });
  return { role, created: true };
}

// ── Helper: criar ou reutilizar canal ─────────────────────────────────────────
async function upsertChannel(guild, opts, log) {
  const existing = guild.channels.cache.find(
    c => c.name === opts.name && c.parentId === (opts.parent ?? null)
  );
  if (existing) {
    log.push(`  ⏭️ Canal já existe: ${opts.name}`);
    return existing;
  }
  const ch = await guild.channels.create(opts);
  log.push(`  ✅ Canal criado: ${opts.name}`);
  return ch;
}

// ── Montar overwrites de permissão ────────────────────────────────────────────
function buildOverwrites(guild, roles, type = 'player') {
  const everyoneId = guild.roles.everyone.id;
  const playerId   = roles['🌸 Player | Ayasaka']?.id;
  const managerId  = roles['📋 Manager | Ayasaka']?.id;

  const PLAYER_ALLOW = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.Connect,
    PermissionFlagsBits.Speak,
    PermissionFlagsBits.AddReactions,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.UseApplicationCommands,
    PermissionFlagsBits.CreatePublicThreads,
    PermissionFlagsBits.SendMessagesInThreads,
  ];

  const MANAGER_EXTRA = [
    ...PLAYER_ALLOW,
    PermissionFlagsBits.MentionEveryone,
    PermissionFlagsBits.ManageMessages,
  ];

  // Canais públicos da categoria (visível para player e manager)
  if (type === 'player') {
    return [
      { id: everyoneId, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
      ...(playerId   ? [{ id: playerId,  type: OverwriteType.Role, allow: PLAYER_ALLOW  }] : []),
      ...(managerId  ? [{ id: managerId, type: OverwriteType.Role, allow: MANAGER_EXTRA }] : []),
    ];
  }

  // Canais privados de trio (apenas manager e staff vêem)
  if (type === 'trio') {
    return [
      { id: everyoneId, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
      ...(managerId ? [{ id: managerId, type: OverwriteType.Role, allow: MANAGER_EXTRA }] : []),
    ];
  }

  // Canais de voz: player e manager podem entrar
  if (type === 'voice') {
    return [
      { id: everyoneId, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
      ...(playerId  ? [{ id: playerId,  type: OverwriteType.Role, allow: PLAYER_ALLOW  }] : []),
      ...(managerId ? [{ id: managerId, type: OverwriteType.Role, allow: MANAGER_EXTRA }] : []),
    ];
  }

  return [];
}

// ── Comando ───────────────────────────────────────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-ayasaka')
    .setDescription('Cria a estrutura completa do AYASAKA PROTOCOL (cargos, canais, permissões)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const log   = [];

    try {
      await guild.roles.fetch();
      await guild.channels.fetch();

      // ── 1. Criar cargos ────────────────────────────────────────────────────
      log.push('**— Cargos —**');
      const roles = {};
      for (const def of ROLES_DEF) {
        const { role, created } = await upsertRole(guild, def);
        roles[def.name] = role;
        log.push(created
          ? `✅ Cargo criado: **${def.name}**`
          : `⏭️ Cargo já existe: **${def.name}**`);
      }

      // ── 2. Criar categoria principal ───────────────────────────────────────
      log.push('\n**— Categoria & Canais —**');
      const CAT_NAME = '🌸 AYASAKA PROTOCOL';
      const catOverwrites = buildOverwrites(guild, roles, 'player');

      let category = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name === CAT_NAME
      );
      if (category) {
        await category.permissionOverwrites.set(catOverwrites, 'Setup Ayasaka');
        log.push(`⏭️ Categoria já existe (permissões atualizadas): **${CAT_NAME}**`);
      } else {
        category = await guild.channels.create({
          name:                 CAT_NAME,
          type:                 ChannelType.GuildCategory,
          permissionOverwrites: catOverwrites,
          reason:               'Setup Ayasaka Protocol',
        });
        log.push(`✅ Categoria criada: **${CAT_NAME}**`);
      }

      // ── 3. Canais de texto públicos ────────────────────────────────────────
      for (const chName of MAIN_CHANNELS) {
        await upsertChannel(guild, {
          name:   chName,
          type:   ChannelType.GuildText,
          parent: category.id,
          reason: 'Setup Ayasaka Protocol',
        }, log);
      }

      // ── 4. Separador visual ────────────────────────────────────────────────
      await upsertChannel(guild, {
        name:   '━━━━━━━━━━━━━━━━',
        type:   ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, type: OverwriteType.Role,
            deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel] },
          ...(roles['📋 Manager | Ayasaka']
            ? [{ id: roles['📋 Manager | Ayasaka'].id, type: OverwriteType.Role,
                deny: [PermissionFlagsBits.SendMessages],
                allow: [PermissionFlagsBits.ViewChannel] }]
            : []),
          ...(roles['🌸 Player | Ayasaka']
            ? [{ id: roles['🌸 Player | Ayasaka'].id, type: OverwriteType.Role,
                deny: [PermissionFlagsBits.SendMessages],
                allow: [PermissionFlagsBits.ViewChannel] }]
            : []),
        ],
        reason: 'Setup Ayasaka Protocol',
      }, log);

      // ── 5. Canais privados de trio (texto) ─────────────────────────────────
      const trioOverwrites = buildOverwrites(guild, roles, 'trio');
      for (const chName of TRIO_TEXT) {
        await upsertChannel(guild, {
          name:                 chName,
          type:                 ChannelType.GuildText,
          parent:               category.id,
          permissionOverwrites: trioOverwrites,
          reason:               'Setup Ayasaka Protocol',
        }, log);
      }

      // ── 6. Canais de voz dos trios ─────────────────────────────────────────
      const voiceOverwrites = buildOverwrites(guild, roles, 'voice');
      for (const chName of TRIO_VOICE) {
        await upsertChannel(guild, {
          name:                 chName,
          type:                 ChannelType.GuildVoice,
          parent:               category.id,
          userLimit:            3,
          permissionOverwrites: voiceOverwrites,
          reason:               'Setup Ayasaka Protocol',
        }, log);
      }

      // ── Resposta final ─────────────────────────────────────────────────────
      // Discord embeds têm limite de 4096 caracteres; dividir se necessário
      const description = log.join('\n');
      const chunks = [];
      let current = '';
      for (const line of log) {
        if ((current + '\n' + line).length > 3800) {
          chunks.push(current);
          current = line;
        } else {
          current = current ? current + '\n' + line : line;
        }
      }
      if (current) chunks.push(current);

      const embeds = chunks.map((chunk, i) =>
        new EmbedBuilder()
          .setTitle(i === 0 ? '🌸 Setup Ayasaka Protocol concluído' : null)
          .setColor(0xFF69B4)
          .setDescription(chunk)
          .setFooter(i === chunks.length - 1
            ? { text: 'Ayasaka Protocol · Campeonato Feminino · COD Mobile 3x3' }
            : null)
          .setTimestamp(i === chunks.length - 1 ? new Date() : null)
      );

      embeds[embeds.length - 1].addFields(
        {
          name:  '🔐 Isolamento',
          value:
            '`🌸 Player | Ayasaka` → acessa canais públicos + voz\n' +
            '`📋 Manager | Ayasaka` → acessa tudo, incluindo canais de trio\n' +
            'Nenhum canal é visível para `@everyone` sem um desses cargos.',
          inline: false,
        },
        {
          name:  '📌 Próximos passos',
          value:
            '1. Configure o **Carl-bot** com os botões de auto-role para `🌸 Player | Ayasaka` e `📋 Manager | Ayasaka`.\n' +
            '2. Atribua os cargos de **Staff** com permissão de administrador para acesso total.\n' +
            '3. Os canais `💗┃trio-XX` são visíveis apenas para Managers — atribua acesso individual conforme necessário.',
          inline: false,
        }
      );

      await interaction.editReply({ embeds });

    } catch (err) {
      console.error('[setup-ayasaka] Erro:', err);

      const msg = err.code === 50013
        ? 'O bot não tem permissão suficiente. Certifique-se de que o cargo do bot está **acima** dos cargos que ele vai criar.'
        : err.message;

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro durante o setup')
            .setColor(0xFF0000)
            .setDescription(msg)
            .setTimestamp(),
        ],
      });
    }
  },
};
