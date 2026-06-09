const {
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { match, getResponse } = require('../utils/faqMatcher');

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

function buildAnswerContainer(question, response, isFunny = false) {
  const color  = isFunny ? 0x57F287 : 0xFFA500;
  const footer = isFunny
    ? '-# 😂 Oblivion League · FAQ · Resposta Aleatória'
    : '-# 🌐 Oblivion League · FAQ Automático';

  return new ContainerBuilder()
    .setAccentColor(color)
    .addTextDisplayComponents(txt(`-# ❓ ${question}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(response))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt(footer));
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

async function handleFaqMessage(message) {
  if (message.author.bot) return;

  const inFaq = isFaqChannel(message.channel);
  if (!inFaq) return;

  const question = message.content.trim();
  if (!question || question.length < 3) return;

  const result = match(question);

  let container;
  if (result) {
    const response = getResponse(result.entry);
    const isFunny  = result.entry.funny === true;
    container = buildAnswerContainer(question, response, isFunny);
  } else {
    container = buildFallbackContainer(question);
  }

  try {
    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
    console.log(`[FAQ] "${question.slice(0, 50)}" → ${result ? result.entry.id : 'fallback'} (score: ${result?.score?.toFixed(2) ?? 0})`);
  } catch (err) {
    console.error('[FAQ] Erro ao responder:', err.message);
  }
}

module.exports = { handleFaqMessage };
