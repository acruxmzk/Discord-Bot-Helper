const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  OverwriteType,
} = require('discord.js');

// ── Identidade visual ─────────────────────────────────────────────────────────
const CAT_MAIN  = '🌸 𝒜𝓎𝒶𝓈𝒶𝓀𝒶 𝒫𝓇𝑜𝓉𝑜𝒸𝑜𝓁';
const CAT_TRIOS = '🎀 𝒯𝓇𝒾𝑜𝓈';

// ── Cargos ────────────────────────────────────────────────────────────────────
const ROLES_DEF = [
  { name: '🌸 Player | Ayasaka',  color: 0xFF69B4, hoist: true },
  { name: '📋 Manager | Ayasaka', color: 0xB983FF, hoist: true },
];

// ── Canais institucionais (categoria principal) ────────────────────────────────
const MAIN_CHANNELS = [
  '📜┃𝓡𝓮𝓰𝓻𝓪𝓼',
  '📢┃𝓐𝓷ú𝓷𝓬𝓲𝓸𝓼',
  '👥┃𝓛𝓲𝓷𝓮𝓾𝓹𝓼',
  '🏆┃𝓡𝓮𝓼𝓾𝓵𝓽𝓪𝓭𝓸𝓼',
  '💬┃𝓒𝓱𝓪𝓽',
  '🎫┃𝓢𝓾𝓹𝓸𝓻𝓽𝓮',
  '📝┃𝓘𝓷𝓼𝓬𝓻𝓲çõ𝓮𝓼',
];

// ── Trios: 25 pares intercalados [texto, voz] ─────────────────────────────────
// texto acima → voz abaixo, exatamente como o Discord ordena por posição
const TRIO_PAIRS = Array.from({ length: 25 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return [
    { name: `💗┃𝓽𝓻𝓲𝓸-${n}`, type: ChannelType.GuildText  },
    { name: `🔊┃𝓽𝓻𝓲𝓸-${n}`, type: ChannelType.GuildVoice, userLimit: 3 },
  ];
}).flat(); // 50 canais — exatamente no limite do Discord

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

// ── Helper: criar ou reutilizar categoria ─────────────────────────────────────
async function upsertCategory(guild, name, overwrites, log) {
  const existing = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === name
  );
  if (existing) {
    await existing.permissionOverwrites.set(overwrites, 'Setup Ayasaka');
    log.push(`⏭️ Categoria já existe (permissões atualizadas): **${name}**`);
    return existing;
  }
  const cat = await guild.channels.create({
    name,
    type:                 ChannelType.GuildCategory,
    permissionOverwrites: overwrites,
    reason:               'Setup Ayasaka Protocol',
  });
  log.push(`✅ Categoria criada: **${name}**`);
  return cat;
}

// ── Helper: criar ou reutilizar canal ─────────────────────────────────────────
async function upsertChannel(guild, opts, log) {
  const existing = guild.channels.cache.find(
    c => c.name === opts.name && c.parentId === opts.parent
  );
  if (existing) {
    log.push(`  ⏭️ Já existe: ${opts.name}`);
    return existing;
  }
  const ch = await guild.channels.create(opts);
  log.push(`  ✅ Criado: ${opts.name}`);
  return ch;
}

// ── Montar overwrites ─────────────────────────────────────────────────────────
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

  const MANAGER_ALLOW = [
    ...PLAYER_ALLOW,
    PermissionFlagsBits.MentionEveryone,
    PermissionFlagsBits.ManageMessages,
  ];

  const base = [
    { id: everyoneId, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
  ];

  if (type === 'player') {
    // Canais públicos: player e manager acessam
    return [
      ...base,
      ...(playerId  ? [{ id: playerId,  type: OverwriteType.Role, allow: PLAYER_ALLOW  }] : []),
      ...(managerId ? [{ id: managerId, type: OverwriteType.Role, allow: MANAGER_ALLOW }] : []),
    ];
  }

  if (type === 'trio') {
    // Canais de trio: apenas manager (representa a equipe)
    return [
      ...base,
      ...(managerId ? [{ id: managerId, type: OverwriteType.Role, allow: MANAGER_ALLOW }] : []),
    ];
  }

  return base;
}

// ── Comando ───────────────────────────────────────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-ayasaka')
    .setDescription('Cria a estrutura completa do 🌸 Ayasaka Protocol (duas categorias, Unicode, permissões)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const log   = [];

    try {
      await guild.roles.fetch();
      await guild.channels.fetch();

      // ── 1. Cargos ──────────────────────────────────────────────────────────
      log.push('**— Cargos —**');
      const roles = {};
      for (const def of ROLES_DEF) {
        const { role, created } = await upsertRole(guild, def);
        roles[def.name] = role;
        log.push(created
          ? `✅ Cargo criado: **${def.name}**`
          : `⏭️ Cargo já existe: **${def.name}**`);
      }

      // ── 2. Categoria principal ─────────────────────────────────────────────
      log.push('\n**— 🌸 Ayasaka Protocol —**');
      const playerOverwrites = buildOverwrites(guild, roles, 'player');
      const catMain = await upsertCategory(guild, CAT_MAIN, playerOverwrites, log);

      for (const name of MAIN_CHANNELS) {
        await upsertChannel(guild, {
          name,
          type:   ChannelType.GuildText,
          parent: catMain.id,
          reason: 'Setup Ayasaka Protocol',
        }, log);
      }

      // ── 3. Categoria de trios ──────────────────────────────────────────────
      log.push('\n**— 🎀 Trios —**');
      const trioOverwrites = buildOverwrites(guild, roles, 'trio');
      const catTrios = await upsertCategory(guild, CAT_TRIOS, trioOverwrites, log);

      for (const ch of TRIO_PAIRS) {
        await upsertChannel(guild, {
          name:      ch.name,
          type:      ch.type,
          parent:    catTrios.id,
          userLimit: ch.userLimit ?? 0,
          reason:    'Setup Ayasaka Protocol',
        }, log);
      }

      // ── Resposta final ─────────────────────────────────────────────────────
      const chunks = [];
      let current  = '';
      for (const line of log) {
        if ((current + '\n' + line).length > 3800) { chunks.push(current); current = line; }
        else { current = current ? current + '\n' + line : line; }
      }
      if (current) chunks.push(current);

      const embeds = chunks.map((chunk, i) =>
        new EmbedBuilder()
          .setTitle(i === 0 ? '🌸 𝒜𝓎𝒶𝓈𝒶𝓀𝒶 𝒫𝓇𝑜𝓉𝑜𝒸𝑜𝓁 — Setup concluído' : null)
          .setColor(0xFF69B4)
          .setDescription(chunk)
          .setFooter(i === chunks.length - 1
            ? { text: 'Campeonato Feminino · COD Mobile 3x3 · Duas categorias criadas' }
            : null)
          .setTimestamp(i === chunks.length - 1 ? new Date() : null)
      );

      embeds[embeds.length - 1].addFields(
        {
          name:  '🔐 Isolamento',
          value:
            '`🌸 Player | Ayasaka` → canais públicos + voz\n' +
            '`📋 Manager | Ayasaka` → tudo, incluindo canais de trio\n' +
            '`@everyone` não vê nenhum canal sem um desses cargos.',
          inline: false,
        },
        {
          name:  '📌 Próximos passos',
          value:
            '1. Configure o **Carl-bot** com auto-role para `🌸 Player | Ayasaka` e `📋 Manager | Ayasaka`.\n' +
            '2. A categoria `🎀 𝒯𝓇𝒾𝑜𝓈` tem 25 pares texto+voz — atribua acesso individual por equipe conforme necessário.',
          inline: false,
        }
      );

      await interaction.editReply({ embeds });

    } catch (err) {
      console.error('[setup-ayasaka] Erro:', err);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro durante o setup')
            .setColor(0xFF0000)
            .setDescription(err.code === 50013
              ? 'O bot não tem permissão suficiente. Certifique-se de que o cargo do bot está **acima** dos cargos que ele vai criar.'
              : err.message)
            .setTimestamp(),
        ],
      });
    }
  },
};
