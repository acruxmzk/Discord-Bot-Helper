const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const SUPERSCRIPT_MAP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
function toSup(n) { return String(n).split('').map(d => SUPERSCRIPT_MAP[d]).join(''); }

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Conectado como ${client.user.tag}\n`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const channels = await guild.channels.fetch();

  const category = channels.find(c =>
    c.type === ChannelType.GuildCategory && c.name === '⌬ OBLIVION LEAGUE VOICE'
  );

  if (!category) {
    console.error('Categoria não encontrada.');
    client.destroy();
    return;
  }

  // 1. Renomear verify-¹ → verify¹ (remover o traço)
  console.log('Renomeando canais (removendo traço)...');
  for (let i = 1; i <= 25; i++) {
    const oldName = `📹│verify-${toSup(i)}`;
    const newName = `📹│verify${toSup(i)}`;
    const ch = category.children.cache.find(c => c.name === oldName);
    if (ch) {
      await ch.setName(newName);
      console.log(`  ✅ ${oldName} → ${newName}`);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // 2. Reordenar: voz primeiro, texto abaixo, par por par
  console.log('\nReordenando canais (voz → verificação por UNIT)...');
  await guild.channels.fetch(); // refresh cache

  const pairs = [];
  for (let i = 1; i <= 25; i++) {
    const voiceName  = `⌬ 𝕌ℕ𝕀𝕋 ${toSup(i)}`;
    const verifyName = `📹│verify${toSup(i)}`;
    const voice  = category.children.cache.find(c => c.name === voiceName);
    const verify = category.children.cache.find(c => c.name === verifyName);
    if (voice && verify) pairs.push({ voice, verify });
  }

  // Constrói lista de posições na ordem correta
  const ordered = [];
  for (const { voice, verify } of pairs) {
    ordered.push(voice);
    ordered.push(verify);
  }

  // Aplica as posições em bloco
  await guild.channels.setPositions(
    ordered.map((ch, idx) => ({ channel: ch.id, position: idx }))
  );

  console.log('  ✅ Ordem aplicada: voz → verificação para todas as 25 UNITs');
  console.log('\n🏁 Concluído!');
  client.destroy();
});

client.login(process.env.TOKEN);
