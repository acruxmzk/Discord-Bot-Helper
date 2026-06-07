const {
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { match } = require('../utils/faqMatcher');

const FAQ_CHANNEL_NAMES = ['perguntas-frequentes', 'perguntas', 'faq', 'duvidas'];

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = (s) => new TextDisplayBuilder().setContent(s);

function normalizeName(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isFaqChannel(channel) {
  const name = normalizeName(channel.name ?? '');
  return FAQ_CHANNEL_NAMES.some(n => name.includes(n));
}

function buildAnswerContainer(question, response) {
  return new ContainerBuilder()
    .setAccentColor(0xFFA500)
    .addTextDisplayComponents(txt(`-# ❓ ${question}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(response))
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

async function handleFaqMessage(message) {
  if (message.author.bot) return;

  const channelName = message.channel.name ?? '(sem nome)';
  const inFaq = isFaqChannel(message.channel);
  console.log(`[FAQ] mensagem recebida | canal: "${channelName}" | faq-channel: ${inFaq} | conteúdo: "${message.content.slice(0, 60)}"`);

  if (!inFaq) return;

  const question = message.content.trim();
  if (!question || question.length < 3) {
    console.log(`[FAQ] mensagem ignorada — conteúdo vazio ou muito curto (length: ${question.length})`);
    return;
  }

  const result = match(question);

  const container = result
    ? buildAnswerContainer(question, result.entry.response)
    : buildFallbackContainer(question);

  try {
    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
    console.log(`[FAQ] "${question}" → ${result ? result.entry.id : 'fallback'} (score: ${result?.score?.toFixed(2) ?? 0})`);
  } catch (err) {
    console.error('[FAQ] Erro ao responder:', err);
  }
}

module.exports = { handleFaqMessage };
