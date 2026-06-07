const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const {
  handleTicketOpen,
  handleTicketClose,
  handleTicketCloseConfirm,
  handleTicketCloseCancel,
} = require('./handlers/ticketHandler');
const { handleFaqMessage } = require('./handlers/faqHandler');

const token = process.env.TOKEN;

if (!token) {
  console.error('[ERRO] A variável de ambiente TOKEN não está definida.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
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

const BUTTON_HANDLERS = {
  ticket_open:          handleTicketOpen,
  ticket_close:         handleTicketClose,
  ticket_close_confirm: handleTicketCloseConfirm,
  ticket_close_cancel:  handleTicketCloseCancel,
};

// ── Mensagens — FAQ automático ────────────────────────────────────────────────
client.on('messageCreate', async message => {
  try {
    await handleFaqMessage(message);
  } catch (err) {
    console.error('[ERRO] FAQ messageCreate:', err);
  }
});

// ── Interações ─────────────────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {
  // ── Slash commands ──────────────────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[ERRO] Comando /${interaction.commandName}:`, error);
      const reply = { content: '❌ Ocorreu um erro ao executar este comando.', ephemeral: true };
      if (interaction.deferred || interaction.replied) await interaction.editReply(reply);
      else await interaction.reply(reply);
    }
    return;
  }

  // ── Botões ──────────────────────────────────────────────────────────────
  if (interaction.isButton()) {
    const handler = BUTTON_HANDLERS[interaction.customId];
    if (!handler) return;

    try {
      await handler(interaction);
    } catch (error) {
      console.error(`[ERRO] Botão ${interaction.customId}:`, error);
      const reply = { content: '❌ Ocorreu um erro ao processar este botão.', ephemeral: true };
      if (interaction.deferred || interaction.replied) await interaction.editReply(reply);
      else await interaction.reply(reply);
    }
    return;
  }
});

client.login(token);
