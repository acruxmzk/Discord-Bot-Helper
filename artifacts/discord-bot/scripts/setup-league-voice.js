const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, OverwriteType } = require('discord.js');

const SUPERSCRIPT_MAP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
function toSup(n) { return String(n).split('').map(d => SUPERSCRIPT_MAP[d]).join(''); }

const CATEGORY_NAME  = '⌬ OBLIVION LEAGUE VOICE';
const unitVoiceName  = i => `⌬ 𝕌ℕ𝕀𝕋 ${toSup(i)}`;
const verifyName     = i => `📹│verify-${toSup(i)}`;
const unitRoleName   = i => `UNIT${toSup(i)}`;

const BLOCKED_ROLE_NAMES = ['PLAYER', 'MANAGER', 'VISITOR'];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Conectado como ${client.user.tag}\n`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  await guild.roles.fetch();

  // Roles que devem ser explicitamente bloqueados (caso tenham CONNECT server-wide)
  const blockedRoles = guild.roles.cache.filter(r => BLOCKED_ROLE_NAMES.includes(r.name));
  if (blockedRoles.size > 0) {
    console.log(`Cargos bloqueados encontrados: ${blockedRoles.map(r => r.name).join(', ')}`);
  }

  // Permissões base: @everyone vê, não conecta
  const baseOverwrites = [
    {
      id: guild.roles.everyone.id,
      type: OverwriteType.Role,
      allow: [PermissionFlagsBits.ViewChannel],
      deny:  [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream],
    },
    ...blockedRoles.map(r => ({
      id: r.id,
      type: OverwriteType.Role,
      allow: [PermissionFlagsBits.ViewChannel],
      deny:  [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream],
    })),
  ];

  // Cria a categoria principal
  console.log(`Criando categoria: ${CATEGORY_NAME}`);
  const category = await guild.channels.create({
    name: CATEGORY_NAME,
    type: ChannelType.GuildCategory,
    permissionOverwrites: baseOverwrites,
  });
  console.log(`✅ Categoria criada\n`);

  // Cria 25 pares de canais
  for (let i = 1; i <= 25; i++) {
    const unitRole = guild.roles.cache.find(r => r.name === unitRoleName(i));

    // Permissões do canal: base + liberação para o cargo correto
    const overwrites = [
      ...baseOverwrites,
      ...(unitRole
        ? [{
            id: unitRole.id,
            type: OverwriteType.Role,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.Stream,
              PermissionFlagsBits.UseVAD,
            ],
          }]
        : []),
    ];

    const voiceName  = unitVoiceName(i);
    const videoName  = verifyName(i);

    await guild.channels.create({
      name: voiceName,
      type: ChannelType.GuildVoice,
      parent: category.id,
      permissionOverwrites: overwrites,
    });

    await guild.channels.create({
      name: videoName,
      type: ChannelType.GuildVoice,
      parent: category.id,
      permissionOverwrites: overwrites,
    });

    const roleInfo = unitRole ? `(cargo ${unitRole.name})` : '(cargo não encontrado — sem acesso configurado)';
    console.log(`  ✅ UNIT ${i.toString().padStart(2,' ')} → ${voiceName} + ${videoName} ${roleInfo}`);

    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n🏁 Estrutura criada com sucesso!`);
  client.destroy();
});

client.login(process.env.TOKEN);
