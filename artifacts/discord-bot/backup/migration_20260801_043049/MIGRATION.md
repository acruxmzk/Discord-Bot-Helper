# 🎬 Premiere Bot — Guia de Migração

Siga este passo a passo para colocar o bot em funcionamento em qualquer servidor ou hospedagem.

---

## 1. Pré-requisitos

- **Node.js** v18 ou superior
- **PostgreSQL** (banco de dados)
- **Bot Discord** criado no [Discord Developer Portal](https://discord.com/developers/applications)

---

## 2. Criar o bot no Discord

1. Acesse https://discord.com/developers/applications
2. Clique em **New Application** → dê um nome
3. Vá em **Bot** → clique em **Reset Token** → copie o `TOKEN`
4. Em **OAuth2 → General** → copie o `CLIENT_ID`
5. Ative os **Privileged Gateway Intents**:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
6. Convide o bot para o servidor com as permissões:
   - `applications.commands`
   - `bot` com permissão de **Administrator** (ou ajuste conforme necessário)

---

## 3. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (ou configure as variáveis no painel da hospedagem):

```env
TOKEN=seu_token_aqui
CLIENT_ID=id_do_bot_aqui
GUILD_ID=id_do_servidor_aqui
DATABASE_URL=postgresql://usuario:senha@host:5432/nome_do_banco
```

### Como encontrar cada valor

| Variável | Onde encontrar |
|---|---|
| `TOKEN` | Discord Developer Portal → Bot → Reset Token |
| `CLIENT_ID` | Discord Developer Portal → OAuth2 → Client ID |
| `GUILD_ID` | No Discord: clique com botão direito no servidor → **Copiar ID do servidor** *(modo desenvolvedor ativo)* |
| `DATABASE_URL` | Painel do seu banco PostgreSQL (Supabase, Railway, Neon, etc.) |

> **Ativar modo desenvolvedor no Discord:**
> Configurações → Avançado → Modo Desenvolvedor ✅

---

## 4. Instalar dependências

```bash
npm install
# ou
pnpm install
```

---

## 5. Restaurar o banco de dados (opcional)

Se você tem um dump do banco anterior:

```bash
psql $DATABASE_URL < database_dump.sql
```

O bot também cria as tabelas automaticamente na primeira inicialização.

---

## 6. Registrar os comandos no Discord

Execute **uma única vez** para registrar os slash commands no servidor:

```bash
node deploy-commands.js
```

Saída esperada:
```
[DEPLOY] Preparando: /adicionar
[DEPLOY] Preparando: /assistido
[DEPLOY] Preparando: /filmes
[DEPLOY] Preparando: /help
[DEPLOY] Preparando: /nota
[DEPLOY] Preparando: /painel
[DEPLOY] Preparando: /remover
[DEPLOY] ✅ 7 comando(s) registrados com sucesso!
```

---

## 7. Iniciar o bot

```bash
node index.js
```

Saída esperada:
```
[CMD] Carregado: /adicionar
[CMD] Carregado: /assistido
...
[DB] Tabela movies pronta.
[DB] Tabela movie_panel pronta.
[BOT] Online como NomeDoBot#1234
```

---

## 8. Configurar o painel no servidor

No canal desejado, use o comando:

```
/painel
```

O painel será postado e se atualizará automaticamente sempre que um comando for usado.

---

## 9. Comandos disponíveis

| Comando | Descrição |
|---|---|
| `/adicionar` | Adiciona um filme (com nota opcional já na adição) |
| `/assistido` | Marca como assistido + avaliação |
| `/nota` | Registra ou atualiza a avaliação (0–10) |
| `/remover` | Remove um filme da lista |
| `/filmes` | Lista completa com filtros |
| `/painel` | Posta o painel fixo no canal |
| `/help` | Central de ajuda |

---

## 10. Estrutura de arquivos

```
discord-bot/
├── index.js                  # Entrada principal
├── deploy-commands.js        # Registra slash commands
├── package.json
├── MIGRATION.md              # Este arquivo
├── commands/
│   ├── adicionar.js
│   ├── assistido.js
│   ├── filmes.js
│   ├── help.js
│   ├── nota.js
│   ├── painel.js
│   └── remover.js
├── handlers/
│   └── filmesHandler.js
└── utils/
    ├── buildPanelContainer.js
    ├── clientRef.js
    ├── movieDB.js
    ├── panelBuilder.js
    ├── panelStore.js
    ├── pgPool.js
    └── refreshPanel.js
```

---

## Suporte

Use `/help` no Discord após a configuração para ver todos os comandos com exemplos.
