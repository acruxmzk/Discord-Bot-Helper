const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const token = process.env.TOKEN;
const guildId = process.env.GUILD_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Conectado como ${client.user.tag}`);

  const guild = await client.guilds.fetch(guildId);
  const channels = await guild.channels.fetch();

  const toDelete = channels.filter(
    c => c.type === ChannelType.GuildCategory && /^◢\s*UNIT[⁰-⁹¹²³⁴⁵⁶⁷⁸⁹]+$/.test(c.name)
  );

  if (toDelete.size === 0) {
    console.log('Nenhuma categoria encontrada para excluir.');
    client.destroy();
    return;
  }

  console.log(`\nCategorias a excluir (${toDelete.size}):`);
  for (const [, cat] of toDelete) {
    console.log(`  → "${cat.name}" (${cat.children.cache.size} canais)`);
  }

  console.log('\nIniciando exclusão...');
  for (const [, cat] of toDelete) {
    for (const [, child] of cat.children.cache) {
      await child.delete('Limpeza de categorias UNIT');
      console.log(`  🗑️  Canal: ${child.name}`);
    }
    await cat.delete('Limpeza de categorias UNIT');
    console.log(`  ✅ Categoria: ${cat.name}`);
  }

  console.log('\nConcluído!');
  client.destroy();
});

client.login(token);
