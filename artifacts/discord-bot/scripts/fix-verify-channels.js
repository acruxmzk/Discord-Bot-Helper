const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, OverwriteType } = require('discord.js');

const SUPERSCRIPT_MAP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
function toSup(n) { return String(n).split('').map(d => SUPERSCRIPT_MAP[d]).join(''); }

const unitRoleName = i => `UNIT${toSup(i)}`;
const BLOCKED_ROLE_NAMES = ['PLAYER', 'MANAGER', 'VISITOR'];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Conectado como ${client.user.tag}\n`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  await guild.roles.fetch();

  const channels = await guild.channels.fetch();

  // Encontra a categoria
  const category = channels.find(c =>
    c.type === ChannelType.GuildCategory && c.name === '⌬ OBLIVION LEAGUE VOICE'
  );

  if (!category) {
    console.error('Categoria "⌬ OBLIVION LEAGUE VOICE" não encontrada.');
    client.destroy();
    return;
  }

  const blockedRoles = guild.roles.cache.filter(r => BLOCKED_ROLE_NAMES.includes(r.name));

  const baseOverwrites = [
    {
      id: guild.roles.everyone.id,
      type: OverwriteType.Role,
      allow: [PermissionFlagsBits.ViewChannel],
      deny:  [PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
    },
    ...blockedRoles.map(r => ({
      id: r.id,
      type: OverwriteType.Role,
      allow: [PermissionFlagsBits.ViewChannel],
      deny:  [PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
    })),
  ];

  console.log('Corrigindo canais verify (voz → texto)...\n');

  for (let i = 1; i <= 25; i++) {
    const verifyName = `📹│verify-${toSup(i)}`;

    // Deleta o canal de voz existente
    const existing = category.children.cache.find(c => c.name === verifyName);
    if (existing) {
      await existing.delete('Recriando como canal de texto');
    }

    // Permissão com acesso para o cargo da UNIT
    const unitRole = guild.roles.cache.find(r => r.name === unitRoleName(i));
    const overwrites = [
      ...baseOverwrites,
      ...(unitRole
        ? [{
            id: unitRole.id,
            type: OverwriteType.Role,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
            ],
          }]
        : []),
    ];

    // Recria como canal de texto, logo após o canal de voz da UNIT
    const voiceChannel = category.children.cache.find(c => c.name === `⌬ 𝕌ℕ𝕀𝕋 ${toSup(i)}`);
    await guild.channels.create({
      name: verifyName,
      type: ChannelType.GuildText,
      parent: category.id,
      position: voiceChannel ? voiceChannel.position + 1 : undefined,
      permissionOverwrites: overwrites,
    });

    console.log(`  ✅ UNIT ${String(i).padStart(2,' ')} → ${verifyName} recriado como texto`);
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('\n🏁 Todos os canais verify corrigidos!');
  client.destroy();
});

client.login(process.env.TOKEN);
