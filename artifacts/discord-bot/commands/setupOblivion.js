const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  OverwriteType,
} = require('discord.js');

// ── Definições da estrutura ────────────────────────────────────────────────────

const ROLES_DEF = [
  { name: '👑 Owner',          color: 0xFFD700, hoist: true, position: 4 },
  { name: '🎖 Manager',        color: 0xC0C0C0, hoist: true, position: 3 },
  { name: '⚫ Kurosaka Player', color: 0x555555, hoist: true, position: 1 },
];

const CATEGORIES_DEF = [
  {
    name: '◢◤ ＯＢＬＩＶＩＯＮ ◥◣',
    access: 'everyone',
    channels: [
      { name: '🔊・reunião', type: ChannelType.GuildVoice },
    ],
  },
  {
    name: '◢◤ ＫＵＲＯＳＡＫＡ ◥◣',
    access: 'kurosaka',
    channels: [
      { name: '🧠・estratégia',      type: ChannelType.GuildText  },
      { name: '🎥・clips',           type: ChannelType.GuildText  },
      { name: '📊・tabela-kurosaka', type: ChannelType.GuildText  },
      { name: '🔊・kurosaka',        type: ChannelType.GuildVoice },
    ],
  },
];

// ── Helper: criar ou encontrar cargo ──────────────────────────────────────────
async function upsertRole(guild, def) {
  const existing = guild.roles.cache.find(r => r.name === def.name);
  if (existing) return { role: existing, created: false };
  const role = await guild.roles.create({
    name:        def.name,
    color:       def.color,
    hoist:       def.hoist,
    mentionable: false,
    reason:      'Setup Oblivion',
  });
  return { role, created: true };
}

// ── Helper: montar overwrites de permissão ────────────────────────────────────
function buildOverwrites(guild, access, roles) {
  const everyoneId = guild.roles.everyone.id;
  const managerId  = roles['🎖 Manager']?.id;
  const kurosakaId = roles['⚫ Kurosaka Player']?.id;

  const BASE_ALLOW = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.Connect,
    PermissionFlagsBits.Speak,
    PermissionFlagsBits.AddReactions,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.AttachFiles,
  ];

  if (access === 'everyone') {
    return [
      {
        id:    everyoneId,
        type:  OverwriteType.Role,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
        deny:  [PermissionFlagsBits.SendMessages],
      },
      ...(managerId ? [{ id: managerId, type: OverwriteType.Role, allow: BASE_ALLOW }] : []),
    ];
  }

  const memberRoleId = kurosakaId;
  const overwrites = [
    {
      id:   everyoneId,
      type: OverwriteType.Role,
      deny: [PermissionFlagsBits.ViewChannel],
    },
  ];
  if (managerId)    overwrites.push({ id: managerId,    type: OverwriteType.Role, allow: BASE_ALLOW });
  if (memberRoleId) overwrites.push({ id: memberRoleId, type: OverwriteType.Role, allow: BASE_ALLOW });
  return overwrites;
}

// ── Comando ───────────────────────────────────────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-oblivion')
    .setDescription('Cria a estrutura completa do servidor Oblivion (cargos + categorias + permissões)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const log   = [];

    try {
      // ── 1. Criar/encontrar cargos ────────────────────────────────────────
      const roles = {};
      for (const def of ROLES_DEF) {
        const { role, created } = await upsertRole(guild, def);
        roles[def.name] = role;
        log.push(created ? `✅ Cargo criado: **${def.name}**` : `⏭️ Cargo já existe: **${def.name}**`);
      }

      // ── 2. Criar categorias e canais ─────────────────────────────────────
      for (const catDef of CATEGORIES_DEF) {
        const overwrites = buildOverwrites(guild, catDef.access, roles);

        const existing = guild.channels.cache.find(
          c => c.type === ChannelType.GuildCategory && c.name === catDef.name
        );

        let category;
        if (existing) {
          await existing.permissionOverwrites.set(overwrites, 'Setup Oblivion');
          category = existing;
          log.push(`⏭️ Categoria já existe (permissões atualizadas): **${catDef.name}**`);
        } else {
          category = await guild.channels.create({
            name:                 catDef.name,
            type:                 ChannelType.GuildCategory,
            permissionOverwrites: overwrites,
            reason:               'Setup Oblivion',
          });
          log.push(`✅ Categoria criada: **${catDef.name}**`);
        }

        // ── 3. Criar canais dentro da categoria ──────────────────────────
        for (const chDef of catDef.channels) {
          const chExisting = guild.channels.cache.find(
            c => c.name === chDef.name && c.parentId === category.id
          );

          if (chExisting) {
            log.push(`  ⏭️ Canal já existe: ${chDef.name}`);
          } else {
            await guild.channels.create({
              name:   chDef.name,
              type:   chDef.type,
              parent: category.id,
              reason: 'Setup Oblivion',
            });
            log.push(`  ✅ Canal criado: ${chDef.name}`);
          }
        }
      }

      // ── Resposta final ───────────────────────────────────────────────────
      const embed = new EmbedBuilder()
        .setTitle('⚙️ Setup Oblivion concluído')
        .setColor(0xFFA500)
        .setDescription(log.join('\n'))
        .addFields(
          {
            name:   '🔐 Isolamento',
            value:
              '`⚫ Kurosaka Player` acessa a categoria Kurosaka\n' +
              '`🎖 Manager` vê tudo',
            inline: false,
          },
          {
            name:  '📌 Próximos passos',
            value: 'Atribua os cargos manualmente nos membros. Para personalizar permissões extras, use `/private-category`.',
            inline: false,
          }
        )
        .setFooter({ text: 'Lima.gg · Setup Oblivion' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error('[setup-oblivion] Erro:', err);

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
