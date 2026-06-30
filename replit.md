# Oblivion League Discord Bot

Bot de administração para o servidor Discord da **Oblivion League** — campeonato de Free Fire. Gerencia bans, squads, inscrições, tickets, FAQ com IA, filmes, e muito mais.

## Run & Operate

- **Workflow:** `Discord Bot` — `cd artifacts/discord-bot && node index.js`
- **Deploy de comandos:** `cd artifacts/discord-bot && node deploy-commands.js` (rodar uma vez após adicionar/alterar slash commands)
- **Health check:** `GET /health` na porta 3000 (exposta como 3001 externamente)
- **Webhook Tally:** `POST /webhook/tally` na porta 3000

## Required Secrets

| Variável | Obrigatória | Descrição |
|---|---|---|
| `TOKEN` | ✅ Sim | Discord bot token |
| `DATABASE_URL` | ✅ Sim | Gerenciada automaticamente pelo Replit PostgreSQL |
| `GROQ_API_KEY` | ❌ Opcional | Classificador de FAQ com IA (Groq / Llama 3.1) |

## Stack

- Node.js 20, CommonJS (sem TypeScript)
- discord.js v14
- PostgreSQL via `pg` (pool em `utils/pgPool.js`)
- Express 5 (servidor webhook na porta 3000)
- OpenAI SDK apontando para Groq (`api.groq.com`)

## Where things live

- `artifacts/discord-bot/` — raiz do bot
- `commands/` — slash commands (carregados automaticamente pelo index.js)
- `handlers/` — handlers de eventos (ticket, FAQ, ban check, Tally webhook, filmes)
- `utils/` — pool PG, DB helpers (banDB, fichaDB, regulamentoDB, tallyDB, movieDB, panelStore), Groq classifier
- `config/config.js` — configurações estáticas (cor padrão, número de squads, prefixo)

## Architecture decisions

- Tabelas criadas via `CREATE TABLE IF NOT EXISTS` no `initDB()` na inicialização — sem ferramenta de migration separada.
- Auto-ping a cada 4 min para manter o processo vivo no Replit (complementa UptimeRobot/cron-job.org).
- Groq classifier retorna `null` silenciosamente se `GROQ_API_KEY` não estiver definida — FAQ cai para keyword matching.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- O bot exige `TOKEN` no ambiente. Sem ele, o processo encerra imediatamente com erro.
- Rodar `node deploy-commands.js` é necessário para registrar novos slash commands no Discord.
- As tabelas são criadas na inicialização; se o banco mudar, pode ser necessário rodar `ALTER TABLE` manualmente.
