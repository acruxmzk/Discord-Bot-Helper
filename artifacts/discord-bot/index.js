const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs      = require('fs');
const path    = require('path');
const express = require('express');

const {
  handleTicketClose,
  handleTicketCloseConfirm,
  handleTicketCloseCancel,
} = require('./handlers/ticketHandler');

const { handleSupportOpen } = require('./handlers/supportHandler');

const { handleFaqMessage }    = require('./handlers/faqHandler');
const { handleBanCheck }      = require('./handlers/banCheckHandler');
const { handleTallyWebhook }  = require('./handlers/tallyWebhook');

const banDB          = require('./utils/banDB');
const fichaDB        = require('./utils/fichaDB');
const regulamentoDB  = require('./utils/regulamentoDB');

const { handleEditarRegDatasSubmit, handleEditarRegLinkSubmit } = require('./commands/editarRegulamento');

const token = process.env.TOKEN;
if (!token) {
  console.error('[ERRO] TOKEN não definido.');
  process.exit(1);
}

// ── Inicializar tabelas do banco ──────────────────────────────────────────────
async function initDB() {
  try {
    await banDB.init();
    console.log('[DB] Tabela banned_players pronta.');
    await fichaDB.init();
    console.log('[DB] Tabela inscricoes pronta.');
    await regulamentoDB.init();
    console.log('[DB] Tabela regulamento_config pronta.');
  } catch (err) {
    console.error('[DB] Erro ao inicializar tabelas:', err.message);
    process.exit(1);
  }
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
  support_open:         handleSupportOpen,
  ticket_close:         handleTicketClose,
  ticket_close_confirm: handleTicketCloseConfirm,
  ticket_close_cancel:  handleTicketCloseCancel,
};

const MODAL_HANDLERS = {
  editar_reg_datas: handleEditarRegDatasSubmit,
  editar_reg_link:  handleEditarRegLinkSubmit,
};

// Handlers por prefixo (customId contém ':')
function resolveButtonHandler(customId) {
  return BUTTON_HANDLERS[customId] ?? null;
}

function resolveModalHandler(customId) {
  return MODAL_HANDLERS[customId] ?? null;
}

// ── Autocomplete ──────────────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (!interaction.isAutocomplete()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command?.autocomplete) return;
  try {
    await command.autocomplete(interaction);
  } catch (err) {
    console.error(`[ERRO] Autocomplete /${interaction.commandName}:`, err.message);
  }
});

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

  if (interaction.isModalSubmit()) {
    const handler = resolveModalHandler(interaction.customId);
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

// ── Servidor webhook (Tally) ──────────────────────────────────────────────────

function startWebhookServer() {
  const app  = express();
  const port = process.env.WEBHOOK_PORT ?? 3000;

  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => res.json({ ok: true, bot: client.user?.tag ?? 'iniciando' }));

  // Webhook do Tally
  app.post('/webhook/tally', (req, res) => {
    handleTallyWebhook(req, res, client);
  });

  app.listen(port, () => {
    console.log(`[WEBHOOK] Servidor ouvindo na porta ${port} — endpoint: POST /webhook/tally`);
  });
}

// ── Iniciar ───────────────────────────────────────────────────────────────────
initDB().then(() => {
  startWebhookServer();
  client.login(token);
});
