const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const movieDB    = require('./utils/movieDB');
const panelStore = require('./utils/panelStore');
const clientRef  = require('./utils/clientRef');

const { handleFilmesButton, handlePainelButton } = require('./handlers/filmesHandler');

const token = process.env.TOKEN;
if (!token) {
  console.error('[ERRO] TOKEN não definido.');
  process.exit(1);
}

// ── Inicializar banco ─────────────────────────────────────────────────────────
async function initDB() {
  try {
    await movieDB.init();
    console.log('[DB] Tabela movies pronta.');
    await panelStore.init();
    console.log('[DB] Tabela movie_panel pronta.');
  } catch (err) {
    console.error('[DB] Erro ao inicializar tabelas:', err.message);
    process.exit(1);
  }
}

// ── Cliente Discord ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

clientRef.set(client);

client.commands = new Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(path.join(__dirname, 'commands', file));
  if (cmd.data && cmd.execute) {
    client.commands.set(cmd.data.name, cmd);
    console.log(`[CMD] Carregado: /${cmd.data.name}`);
  }
}

// ── Handlers de botão ─────────────────────────────────────────────────────────
const BUTTON_PREFIX_HANDLERS = {
  filmes: handleFilmesButton,
  painel: handlePainelButton,
};

function resolveButtonHandler(customId) {
  const prefix = customId.split(':')[0];
  return BUTTON_PREFIX_HANDLERS[prefix] ?? null;
}

// ── Ready ─────────────────────────────────────────────────────────────────────
client.once('clientReady', () => {
  console.log(`[BOT] Online como ${client.user.tag}`);
  console.log(`[BOT] Servidores: ${client.guilds.cache.size}`);
});

// ── Interações ────────────────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {

  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command?.autocomplete) return;
    try {
      await command.autocomplete(interaction);
    } catch (err) {
      console.error(`[ERRO] Autocomplete /${interaction.commandName}:`, err);
      if (!interaction.responded) await interaction.respond([]);
    }
    return;
  }

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`[ERRO] /${interaction.commandName}:`, err);
      const r = { content: '❌ Erro ao executar o comando.', ephemeral: true };
      if (interaction.deferred || interaction.replied) await interaction.editReply(r);
      else await interaction.reply(r);
    }
    return;
  }

  if (interaction.isButton()) {
    const handler = resolveButtonHandler(interaction.customId);
    if (!handler) return;
    try {
      await handler(interaction);
    } catch (err) {
      console.error(`[ERRO] Botão ${interaction.customId}:`, err);
      const r = { content: '❌ Erro ao processar o botão.', ephemeral: true };
      if (interaction.deferred || interaction.replied) await interaction.editReply(r);
      else await interaction.reply(r);
    }
    return;
  }
});

// ── Iniciar ───────────────────────────────────────────────────────────────────
initDB().then(() => client.login(token));
