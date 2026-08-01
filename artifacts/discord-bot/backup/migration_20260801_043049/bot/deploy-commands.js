const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error('[ERRO] Defina TOKEN, CLIENT_ID e GUILD_ID nas variáveis de ambiente.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data) {
    commands.push(command.data.toJSON());
    console.log(`[DEPLOY] Preparando: /${command.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`[DEPLOY] Registrando ${commands.length} comando(s) no servidor ${guildId}...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log(`[DEPLOY] ✅ ${data.length} comando(s) registrados com sucesso!`);
  } catch (error) {
    console.error('[DEPLOY] ❌ Erro:', error);
  }
})();
