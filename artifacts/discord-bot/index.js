const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.TOKEN;

if (!token) {
  console.error('[ERRO] A variável de ambiente TOKEN não está definida.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log(`[CMD] Carregado: /${command.data.name}`);
  }
}

client.once('ready', () => {
  console.log(`[BOT] Online como ${client.user.tag}`);
  console.log(`[BOT] Servidores: ${client.guilds.cache.size}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[ERRO] Comando /${interaction.commandName}:`, error);

    const reply = { content: '❌ Ocorreu um erro ao executar este comando.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(token);
