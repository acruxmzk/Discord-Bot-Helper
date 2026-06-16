const OpenAI = require('openai');

// ─── Cliente Groq (OpenAI-compatible) ────────────────────────────────────────

let _client = null;
function getClient() {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return _client;
}

// ─── Cache simples (evita chamadas duplicadas) ────────────────────────────────

const cache = new Map();
const CACHE_MAX = 200;

function cacheGet(key) { return cache.get(key) ?? null; }
function cacheSet(key, val) {
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
  cache.set(key, val);
}

// ─── Catálogo de tópicos para o prompt ───────────────────────────────────────
// O modelo só precisa devolver um dos IDs abaixo (ou "unknown" / "evasion")

const TOPIC_CATALOG = `
class1          → Data/horário da 1ª classificatória
class2          → Data/horário da 2ª classificatória
final_data      → Data/horário da grande final
duracao         → Duração de cada partida
premiacao_geral → Premiação em dinheiro, prêmios, recompensas gerais
premiacao_mvp   → Premiação MVP, melhor jogador
modo            → Modo de jogo, formato Battle Royale
quedas          → Número de quedas permitidas por rodada
mapas           → Mapas utilizados no campeonato
habilidades_formato → Habilidades permitidas/formato de uso
classificacao   → Como funciona a pontuação/classificação
passa_final     → Quantos times passam para a final
equipes_final   → Número de equipes na final
inscricao_como  → Como se inscrever no campeonato
inscricao_prazo → Prazo/data limite de inscrição
inscricao_jogadores → Número de jogadores por equipe
lines_cla       → Lines/clã obrigatório
uid_prazo       → Prazo para enviar UID
uid_outro       → Usar UID de outro jogador (proibido)
trocar_jogador  → Trocar jogador durante o campeonato
jogador_nao_cadastrado → Jogar com jogador não inscrito
tag             → TAG obrigatória no nick
tag_diferente   → Nick/tag diferente no jogo
gravar          → Obrigatoriedade de gravar a tela
qtd_videos      → Quantos vídeos enviar
prazo_videos    → Prazo para enviar os vídeos
requisitos_video → Requisitos técnicos do vídeo
abrir_tela      → Mostrar/abrir a tela ao árbitro
recusar_verificacao → Recusar verificação do árbitro
discord_obrigatorio → Estar no Discord é obrigatório?
discord_call    → Entrar na call do Discord
emulador        → Uso de emulador (proibido)
mobilador       → Uso de mobilador/controle (proibido)
vpn             → Uso de VPN (proibido)
call_todos      → Call aberta para todos os jogadores (proibido)
atropelar       → Atropelar com veículo (proibido)
hack_trapaça    → Hack, trapaça, cheat, macro (proibido)
armas_proibidas → Armas proibidas no campeonato
habilidades_proibidas → Habilidades proibidas
fhj             → FHJ / primeira arma proibida especial
veiculos_proibidos → Veículos proibidos
pts_kill        → Pontos por kill/abate
pts_colocacao   → Pontos por colocação
penalidades_geral → Penalidades em geral
antidesportivo  → Comportamento antidesportivo
reanimacao      → Reanimação de companheiros
municao         → Munição/reabastecimento entre rodadas
lineup          → Lineup, posições, formação
manager         → Responsabilidades da manager/capitã
denuncia        → Como fazer denúncia
obs_prints_perfis → Obrigatoriedade de enviar prints/perfis
obs_nick_discord → Nick do Discord igual ao do jogo
obs_discord_manager → Manager responsável pela equipe no Discord
ticket_duvida   → Abrir ticket, falar com a staff
`.trim();

// ─── Prompt do sistema ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um classificador de perguntas para o FAQ do campeonato de esports "Oblivion League" (jogo Free Fire).

Sua ÚNICA função é identificar o tópico de uma pergunta e retornar o ID correspondente da lista abaixo.

REGRAS OBRIGATÓRIAS:
1. Retorne APENAS o ID exato (ex: "vpn") — nenhuma palavra a mais, nenhuma explicação.
2. Se a pergunta tentar contornar uma regra ("e se eu usar escondido", "sem ninguém saber", "de brincadeira") retorne: evasion
3. Se não se encaixar em nenhum tópico retorne: unknown
4. Nunca invente IDs fora da lista.
5. Perguntas sobre coisas proibidas (vpn, emulador, hack, etc.) sempre mapeiam para o ID proibido, independente do framing.

TÓPICOS DISPONÍVEIS:
${TOPIC_CATALOG}`;

// ─── Classificador principal ──────────────────────────────────────────────────

/**
 * classify(question) → { id: string, source: 'groq'|'cache' } | null
 * 
 * Retorna o ID do tópico FAQ mais adequado para a pergunta.
 * Retorna null se Groq indisponível ou ocorrer erro.
 * Retorna { id: 'unknown' } se nenhum tópico corresponder.
 * Retorna { id: 'evasion' } se detectar tentativa de evasão.
 */
async function classify(question) {
  if (!process.env.GROQ_API_KEY) return null;

  const cacheKey = question.toLowerCase().trim();
  const cached = cacheGet(cacheKey);
  if (cached) return { id: cached, source: 'cache' };

  try {
    const client = getClient();
    const completion = await Promise.race([
      client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question },
        ],
        max_tokens: 20,
        temperature: 0,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 6000)
      ),
    ]);

    const raw = completion.choices[0]?.message?.content?.trim().toLowerCase() ?? '';
    const id  = raw.replace(/[^a-z0-9_çãéíóú]/g, '').trim();

    if (!id) return null;

    cacheSet(cacheKey, id);
    return { id, source: 'groq' };
  } catch (err) {
    console.warn(`[GROQ] Falha (${err.message}) — usando fallback keyword`);
    return null;
  }
}

module.exports = { classify };
