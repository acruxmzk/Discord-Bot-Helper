const {
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { match, getResponse, FAQ_DB, detectEvasion, normalize } = require('../utils/faqMatcher');
const { classify } = require('../utils/groqClassifier');

const FAQ_CHANNEL_NAMES = ['perguntas-frequentes', 'perguntas', 'faq', 'duvidas', 'dúvidas'];

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = (s) => new TextDisplayBuilder().setContent(s);

function normalizeName(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isFaqChannel(channel) {
  const name = normalizeName(channel.name ?? '');
  return FAQ_CHANNEL_NAMES.some(n => name.includes(n));
}

// ─── Builders de container ────────────────────────────────────────────────────

function buildAnswerContainer(question, response, isFunny = false, isEvasion = false) {
  const color  = isEvasion ? 0xFF4444 : isFunny ? 0x57F287 : 0xFFA500;
  const footer = isFunny
    ? '-# 😂 Oblivion League · FAQ · Resposta Aleatória'
    : '-# 🌐 Oblivion League · FAQ Automático';

  const builder = new ContainerBuilder()
    .setAccentColor(color)
    .addTextDisplayComponents(txt(`-# ❓ ${question}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(response));

  if (isEvasion) {
    builder
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        '⚠️ **Reformular a pergunta não muda a resposta.**\n' +
        '-# A regra é a mesma independente do framing, contexto ou intenção da pergunta.'
      ));
  }

  builder.addSeparatorComponents(gap()).addTextDisplayComponents(txt(footer));
  return builder;
}

function buildEvasionOnlyContainer(question) {
  return new ContainerBuilder()
    .setAccentColor(0xFF4444)
    .addTextDisplayComponents(txt(`-# ❓ ${question}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '🚫 **Isso não é permitido.**\n\n' +
      'Reformular a pergunta — com "e se", "escondido", "sem ninguém saber" ou qualquer variação — não altera a regra.\n\n' +
      '📋 Consulte o regulamento completo ou abra um **ticket** se tiver dúvidas legítimas.'
    ))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt('-# 🌐 Oblivion League · FAQ Automático'));
}

function buildFallbackContainer(question) {
  return new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(txt(`-# ❓ ${question}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      '❓ Não encontrei essa informação no regulamento oficial da **Oblivion League**.\n\n' +
      '🎫 Abra um **ticket** para falar diretamente com a equipe administrativa.'
    ))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt('-# 🌐 Oblivion League · FAQ Automático'));
}

// ─── Pipeline de resolução ────────────────────────────────────────────────────
//
// Prioridade:
//   1. Evasão pura (JS rápido)          → aviso vermelho
//   2. Ações proibidas (JS rápido)       → resposta fixa + aviso se evasão
//   3. Groq AI classifier               → mapeia intenção → ID do FAQ_DB
//   4. Keyword matching (fallback JS)   → quando Groq falhar/timeout
//   5. Sem resposta                     → ticket

async function resolve(question) {
  const norm      = normalize(question);
  const isEvasion = detectEvasion(norm);

  // 1+2 — JS puro: evasão + proibidos (via match() existente)
  const kwResult = match(question);

  // Se já encontrou algo relevante via keyword (score alto ou ação proibida)
  if (kwResult?.entry && kwResult.score >= 0.5) {
    return { entry: kwResult.entry, evasion: isEvasion, source: 'keyword' };
  }

  // 3 — Groq classifica a intenção
  const groq = await classify(question);

  if (groq) {
    if (groq.id === 'evasion') {
      // Groq detectou evasão — tenta ainda achar a entrada pelo keyword
      const base = kwResult?.entry ?? null;
      return { entry: base, evasion: true, source: 'groq' };
    }

    if (groq.id !== 'unknown') {
      const entry = FAQ_DB.find(e => e.id === groq.id);
      if (entry) return { entry, evasion: isEvasion, source: groq.source };
    }

    // Groq disse "unknown"
    if (isEvasion) return { entry: null, evasion: true, source: 'groq' };
    return { entry: null, evasion: false, source: 'groq' };
  }

  // 4 — Fallback: keyword matching com threshold normal
  if (kwResult?.entry) {
    return { entry: kwResult.entry, evasion: isEvasion, source: 'keyword' };
  }

  // 5 — Nada encontrado
  return isEvasion ? { entry: null, evasion: true, source: 'none' } : null;
}

// ─── Handler principal ────────────────────────────────────────────────────────

async function handleFaqMessage(message) {
  if (message.author.bot) return;

  const inFaq = isFaqChannel(message.channel);
  if (!inFaq) return;

  const question = message.content.trim();
  if (!question || question.length < 3) return;

  const result = await resolve(question);

  let container;
  if (result?.entry) {
    const response = getResponse(result.entry);
    const isFunny  = result.entry.funny === true;
    container = buildAnswerContainer(question, response, isFunny, result.evasion);
  } else if (result?.evasion) {
    container = buildEvasionOnlyContainer(question);
  } else {
    container = buildFallbackContainer(question);
  }

  try {
    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
    const tag = result?.evasion ? `EVASÃO(${result?.entry?.id ?? '?'})` : result?.entry?.id ?? 'fallback';
    console.log(`[FAQ] "${question.slice(0, 60)}" → ${tag} [${result?.source ?? 'none'}]`);
  } catch (err) {
    console.error('[FAQ] Erro ao responder:', err.message);
  }
}

module.exports = { handleFaqMessage };
