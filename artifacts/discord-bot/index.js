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
const tallyDB        = require('./utils/tallyDB');
const movieDB        = require('./utils/movieDB');

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
    await tallyDB.init();
    console.log('[DB] Tabela tally_submissions pronta.');
    await movieDB.init();
    console.log('[DB] Tabela movies pronta.');
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

// ── Canais de log (nomes aceitos, por prioridade) ─────────────────────────────
const LOG_CHANNEL_NAMES = [
  'bot-logs', 'bot-log', 'logs-bot', 'logs',
  'staff-logs', 'staff-log', 'admin-logs',
  'sistema', 'system', 'notificacoes', 'notificações',
];

function normCh(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function findLogChannel() {
  for (const guild of client.guilds.cache.values()) {
    for (const name of LOG_CHANNEL_NAMES) {
      const ch = guild.channels.cache.find(
        c => c.isTextBased?.() && normCh(c.name).includes(name)
      );
      if (ch) return ch;
    }
  }
  return null;
}

client.once('ready', async () => {
  console.log(`[BOT] Online como ${client.user.tag}`);
  console.log(`[BOT] Servidores: ${client.guilds.cache.size}`);

  // ── Notificação de (re)início ──────────────────────────────────────────────
  try {
    const ch = findLogChannel();
    if (ch) {
      const domain   = process.env.REPLIT_DEV_DOMAIN ?? '';
      const uptime   = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const healthUrl = domain ? `https://${domain}:3001/health` : '—';

      const { ContainerBuilder, SeparatorBuilder, TextDisplayBuilder,
              SeparatorSpacingSize, MessageFlags } = require('discord.js');
      const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
      const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
      const txt = s  => new TextDisplayBuilder().setContent(s);

      const container = new ContainerBuilder()
        .setAccentColor(0x57F287)
        .addTextDisplayComponents(txt('✅ **Bot reiniciado e online**'))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(txt(
          `🤖 **${client.user.tag}**\n` +
          `📅 ${uptime}\n` +
          `🌐 Servidores ativos: **${client.guilds.cache.size}**`
        ))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(txt(
          `💓 Health: \`${healthUrl}\`\n` +
          `-# Use /webhook-url para ver todas as URLs`
        ))
        .addSeparatorComponents(gap())
        .addTextDisplayComponents(txt('-# 🌐 Oblivion League · Monitor de Sistema'));

      await ch.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
      console.log(`[BOT] Notificação de início enviada para #${ch.name}`);
    }
  } catch (err) {
    console.warn('[BOT] Notificação de início falhou:', err.message);
  }
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

  // Health check / keep-alive (usado pelo UptimeRobot)
  app.get('/health', (_req, res) => {
    res.json({
      ok:     true,
      bot:    client.user?.tag ?? 'iniciando',
      uptime: Math.floor(process.uptime()),
      ts:     new Date().toISOString(),
    });
  });

  // Webhook do Tally
  app.post('/webhook/tally', (req, res) => {
    handleTallyWebhook(req, res, client);
  });

  app.listen(port, () => {
    const domain     = process.env.REPLIT_DEV_DOMAIN ?? 'localhost';
    const webhookUrl = `https://${domain}:3001/webhook/tally`;
    const healthUrl  = `https://${domain}:3001/health`;
    console.log(`[WEBHOOK] Servidor ativo na porta ${port}`);
    console.log(`[WEBHOOK] Tally  → POST ${webhookUrl}`);
    console.log(`[WEBHOOK] Health → GET  ${healthUrl}`);

    // ── Auto-ping: mantém o processo vivo a cada 4 minutos ──────────────────
    // Complementa serviços externos (UptimeRobot, cron-job.org) como camada
    // extra de keep-alive — sem depender de nada externo.
    if (domain && domain !== 'localhost') {
      const selfUrl = `https://${domain}:3001/health`;
      setInterval(async () => {
        try {
          const https = require('https');
          await new Promise((resolve, reject) => {
            const req = https.get(selfUrl, res => {
              res.resume();
              resolve(res.statusCode);
            });
            req.on('error', reject);
            req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
          });
          console.log(`[KEEPALIVE] ping ok — uptime ${Math.floor(process.uptime() / 60)}min`);
        } catch (err) {
          console.warn(`[KEEPALIVE] ping falhou: ${err.message}`);
        }
      }, 4 * 60 * 1000); // 4 minutos
      console.log('[KEEPALIVE] Auto-ping ativado (a cada 4 min)');
    }
  });
}

// ── Iniciar ───────────────────────────────────────────────────────────────────
initDB().then(() => {
  startWebhookServer();
  client.login(token);
});
