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

const {
  handleAprovarFicha,
  handleRejeitarFicha,
  handleFichaRejeicaoSubmit,
  handleFichaEditarSubmit,
} = require('./handlers/fichaHandler');

const { handleFaqMessage } = require('./handlers/faqHandler');
const { handleBanCheck }   = require('./handlers/banCheckHandler');

const banDB          = require('./utils/banDB');
const fichaDB        = require('./utils/fichaDB');
const regulamentoDB  = require('./utils/regulamentoDB');

const { handleEditarRegDatasSubmit } = require('./commands/editarRegulamento');

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
  ticket_open:          handleTicketOpen,
  form_open:            handleFormOpen,
  ticket_close:         handleTicketClose,
  ticket_close_confirm: handleTicketCloseConfirm,
  ticket_close_cancel:  handleTicketCloseCancel,
};

const MODAL_HANDLERS = {
  form_inscricao:   handleFormInscricao,
  editar_reg_datas: handleEditarRegDatasSubmit,
};

// Handlers por prefixo (customId contém ':')
function resolveButtonHandler(customId) {
  if (BUTTON_HANDLERS[customId]) return BUTTON_HANDLERS[customId];
  if (customId.startsWith('ficha_aprovar:'))  return handleAprovarFicha;
  if (customId.startsWith('ficha_rejeitar:')) return handleRejeitarFicha;
  return null;
}

function resolveModalHandler(customId) {
  if (MODAL_HANDLERS[customId]) return MODAL_HANDLERS[customId];
  if (customId.startsWith('ficha_rejeicao_submit:')) return handleFichaRejeicaoSubmit;
  if (customId.startsWith('ficha_editar_submit:'))   return handleFichaEditarSubmit;
  return null;
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

// ── Iniciar ───────────────────────────────────────────────────────────────────
initDB().then(() => client.login(token));
