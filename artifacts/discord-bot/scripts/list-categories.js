const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const channels = await guild.channels.fetch();

  const categories = channels.filter(c => c.type === ChannelType.GuildCategory);

  console.log(`\nCategorias no servidor (${categories.size}):`);
  for (const [, cat] of categories) {
    console.log(`  "${cat.name}"`);
  }

  client.destroy();
});

client.login(process.env.TOKEN);
