const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const {
  handleTicketOpen,
  handleFormOpen,
  handleFormInscricao,
  handleTicketClose,
  handleTicketCloseConfirm,
  handleTicketCloseCancel,
} = require('./handlers/ticketHandler');
const { handleFaqMessage } = require('./handlers/faqHandler');
const { handleBanCheck }   = require('./handlers/banCheckHandler');

const token = process.env.TOKEN;
if (!token) {
  console.error('[ERRO] TOKEN não definido.');
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
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(path.join(__dirname, 'commands', file));
  if (cmd.data && cmd.execute) {
    client.commands.set(cmd.data.name, cmd);
    console.log(`[CMD] Carregado: /${cmd.data.name}`);
  }
}

client.once('ready', () => {
  console.log(`[BOT] Online como ${client.user.tag}`);
  console.log(`[BOT] Servidores: ${client.guilds.cache.size}`);
});

// ── Roteadores ────────────────────────────────────────────────────────────────
const BUTTON_HANDLERS = {
  ticket_open:          handleTicketOpen,
  form_open:            handleFormOpen,
  ticket_close:         handleTicketClose,
  ticket_close_confirm: handleTicketCloseConfirm,
  ticket_close_cancel:  handleTicketCloseCancel,
};

const MODAL_HANDLERS = {
  form_inscricao: handleFormInscricao,
};

// ── Mensagens ─────────────────────────────────────────────────────────────────
client.on('messageCreate', async message => {
  try { await handleFaqMessage(message); } catch (e) { console.error('[ERRO] FAQ:', e); }
  try { await handleBanCheck(message);   } catch (e) { console.error('[ERRO] BanCheck:', e); }
});

// ── Interações ────────────────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {

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
    const handler = BUTTON_HANDLERS[interaction.customId];
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

  if (interaction.isModalSubmit()) {
    const handler = MODAL_HANDLERS[interaction.customId];
    if (!handler) return;
    try {
      await handler(interaction);
    } catch (err) {
      console.error(`[ERRO] Modal ${interaction.customId}:`, err);
      const r = { content: '❌ Erro ao processar o formulário.', ephemeral: true };
      if (interaction.deferred || interaction.replied) await interaction.editReply(r);
      else await interaction.reply(r);
    }
    return;
  }
});

client.login(token);
