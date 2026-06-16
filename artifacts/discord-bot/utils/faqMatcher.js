// ─── Normalização ─────────────────────────────────────────────────────────────

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  const STOP = new Set([
    'a', 'as', 'o', 'os', 'e', 'eh', 'de', 'do', 'da', 'dos', 'das',
    'no', 'na', 'nos', 'nas', 'em', 'um', 'uma', 'uns', 'umas', 'para',
    'por', 'com', 'que', 'se', 'ja', 'me', 'te', 'eu', 'tu', 'ele',
    'ela', 'foi', 'ser', 'tem', 'ter', 'vai', 'vou', 'sao', 'era',
    'ate', 'ao', 'aos', 'ou', 'pra', 'isso', 'so', 'ta', 'né', 'ne',
    'ai', 'la', 'ca', 'bo', 'ok', 'oi', 'ola', 'boa',
  ]);
  return normalize(text).split(' ').filter(t => t.length > 1 && !STOP.has(t));
}

// ─── Mapa de Sinônimos ────────────────────────────────────────────────────────
// Expande variações para o termo canônico antes do matching

const SYNONYM_MAP = {
  'cheater': 'trapaca', 'cheat': 'trapaca', 'trapasseiro': 'trapaca',
  'hacker': 'hack', 'aimbot': 'hack', 'wallhack': 'hack', 'macro': 'hack',
  'mod': 'hack', 'modded': 'hack', 'modificado': 'hack',
  'joystick': 'mobilador', 'gamepad': 'mobilador', 'controle': 'mobilador',
  'bluestacks': 'emulador', 'ldplayer': 'emulador', 'nox': 'emulador', 'memu': 'emulador',
  'time': 'equipe', 'clan': 'cla',
  'filmar': 'gravar', 'filmagem': 'gravacao', 'clip': 'video',
  'matar': 'kill', 'abater': 'kill', 'eliminar': 'eliminacao',
  'capitar': 'capitao', 'capitar': 'manager', 'lider': 'manager',
  'quando e': 'quando', 'que horas': 'horario',
  'pegar': 'receber', 'recebo': 'receber', 'ganho': 'ganhar',
  'expulsao': 'expulso', 'expulsar': 'expulsao', 'banir': 'banimento',
  'nao pode': 'proibido', 'proibido': 'proibido', 'banido': 'ban',
  'tunel': 'vpn', 'tunnel': 'vpn', 'rede virtual': 'vpn',
  'bazuca': 'arma', 'thumper': 'arma', 'sniper': 'arma', 'purificador': 'arma',
  'skill': 'habilidade', 'skills': 'habilidades',
};

function applySynonyms(tokens) {
  return tokens.map(t => SYNONYM_MAP[t] ?? t);
}

// ─── Detecção de Evasão ───────────────────────────────────────────────────────
// Detecta quando o usuário reformula uma proibição tentando obter outra resposta

const EVASION_SIGNALS = [
  /escondido|as escondidas|escondida/,
  /sem ninguem (saber|ver|perceber|notar)/,
  /ninguem (vai|ira|pode) (saber|ver|perceber|notar|detectar)/,
  /nao (vai|ira|pode|tem como) (detectar|pegar|saber|ver|perceber)/,
  /de brincadeira|so pra testar|so testando|so por hoje/,
  /so dessa vez|uma vez so|por uma vez|uma unica vez/,
  /e se (eu |a gente |ninguem )?(souber|saber|ver|perceber)/,
  /da pra (usar|fazer|jogar|entrar)\s.*(sem (ser )?pego|sem detectar|sem saber)/,
  /consigo (passar|escapar|burlar|enganar|driblar)/,
  /se (usar|fizer|jogar|tentar) mesmo assim/,
  /mas e se/,
  /e se (eu |a gente )?usar mesmo/,
  /posso\s.*(escondido|sem avisar|sem ninguem ver)/,
];

function detectEvasion(normalizedText) {
  return EVASION_SIGNALS.some(pattern => pattern.test(normalizedText));
}

// ─── Mapa de Ações Proibidas ──────────────────────────────────────────────────
// Qualquer pergunta sobre ação proibida → sempre retorna a resposta de proibição,
// independente do framing (hipotético, negação, evasão, etc.)

const PROHIBITED_MAP = [
  { triggers: ['vpn', 'tunel', 'tunnel'], entryId: 'vpn' },
  { triggers: ['emulador', 'bluestacks', 'ldplayer', 'nox', 'memu', 'pc', 'computador'], entryId: 'emulador' },
  { triggers: ['mobilador', 'controle', 'joystick', 'gamepad'], entryId: 'mobilador' },
  { triggers: ['hack', 'trapaca', 'cheat', 'aimbot', 'wallhack', 'macro', 'mod', 'modded', 'modificado'], entryId: 'hack_trapaça' },
  { triggers: ['atropelar', 'atropelo'], entryId: 'atropelar' },
];

function matchProhibited(tokens) {
  for (const rule of PROHIBITED_MAP) {
    if (tokens.some(t => rule.triggers.includes(t))) {
      return rule.entryId;
    }
  }
  return null;
}

// ─── Detecção de Negação ──────────────────────────────────────────────────────
// "VPN não é proibida?" → normaliza para tratar como "VPN proibida"
// Remove a negação para que o matching encontre a entrada correta

const NEGATION_PATTERNS = [
  /nao (e|eh|seria|seria|precisa|preciso|tem|ha|existe)\s/g,
  /\b(nao|nem)\s+(e|eh|sera|vai|ira|pode|tem|precisa|preciso)\b/g,
];

function stripNegation(text) {
  let result = text;
  for (const p of NEGATION_PATTERNS) result = result.replace(p, ' ');
  return result;
}

// ─── Resposta aleatória (suporta string simples ou array) ─────────────────────

function getResponse(entry) {
  if (Array.isArray(entry.responses) && entry.responses.length > 0) {
    return entry.responses[Math.floor(Math.random() * entry.responses.length)];
  }
  return entry.response ?? '—';
}

// ─── Base de perguntas ────────────────────────────────────────────────────────

const FAQ_DB = [

  // ══════════════════════════════════════════════════════════
  // CRONOGRAMA
  // ══════════════════════════════════════════════════════════
  {
    id: 'class1',
    keywords: ['primeira', '1a', 'primeiro', 'classificatoria', 'quando', 'data', 'dia', 'horario', 'inicio'],
    response: '📅 A **1ª Classificatória** acontecerá em **08/07/2026** às **20h00**.',
  },
  {
    id: 'class2',
    keywords: ['segunda', '2a', 'segundo', 'classificatoria', 'quando', 'data', 'dia', 'horario'],
    response: '📅 A **2ª Classificatória** acontecerá em **09/07/2026** às **20h00**.',
  },
  {
    id: 'final_data',
    keywords: ['final', 'grande', 'quando', 'dia', 'data', 'horario', 'hora'],
    response: '🏆 A **Grande Final** acontecerá em **11/07/2026** às **22h00**.',
  },
  {
    id: 'duracao',
    keywords: ['dias', 'dura', 'quantos', 'campeonato', 'duracao', 'periodo', 'total'],
    response: '📅 O campeonato será realizado nos dias **08**, **09** e **11 de julho de 2026**.',
  },

  // ══════════════════════════════════════════════════════════
  // PREMIAÇÃO
  // ══════════════════════════════════════════════════════════
  {
    id: 'premiacao_geral',
    keywords: ['premiacao', 'premio', 'premios', 'quanto', 'ganha', 'valor', 'dinheiro', 'reais', 'pagar', 'receber', 'total'],
    response:
      '💰 **Premiação Total: R$ 2.000,00**\n\n' +
      '🥇 1º Lugar — R$ 1.000,00\n' +
      '🥈 2º Lugar — R$ 500,00\n' +
      '🥉 3º Lugar — R$ 250,00\n' +
      '🎖️ 4º Lugar — R$ 200,00\n' +
      '🏅 MVP — R$ 50,00',
  },
  {
    id: 'premiacao_mvp',
    keywords: ['mvp', 'melhor', 'jogador', 'individual', 'premiacao', 'cinquenta'],
    response: '🏅 Sim! O **MVP** receberá **R$ 50,00** — prêmio individual pela melhor performance.',
  },

  // ══════════════════════════════════════════════════════════
  // FORMATO
  // ══════════════════════════════════════════════════════════
  {
    id: 'modo',
    keywords: ['modo', 'squad', 'tipo', 'formato', 'jogadores', 'equipe', 'time', 'duo', 'solo'],
    response: '👥 O campeonato será disputado no modo **Squad** (4 jogadores por equipe).',
  },
  {
    id: 'quedas',
    keywords: ['quedas', 'quantas', 'rodadas', 'partidas', 'games', 'rounds', 'queda'],
    response:
      '🎯 **Classificatórias:** 3 quedas por dia.\n' +
      '🏆 **Grande Final:** 4 quedas.',
  },
  {
    id: 'mapas',
    keywords: ['mapa', 'mapas', 'qual', 'onde', 'isolated', 'blackout', 'cenario'],
    response: '🗺️ Os mapas utilizados serão **Isolated** e **Blackout**.',
  },
  {
    id: 'habilidades_formato',
    keywords: ['habilidade', 'habilidades', 'skill', 'skills', 'ativa', 'ativas', 'usar', 'final'],
    response:
      '⚡ Na **Grande Final** haverá quedas com e sem habilidades:\n\n' +
      '> 2 quedas **com** habilidades\n' +
      '> 2 quedas **sem** habilidades',
  },

  // ══════════════════════════════════════════════════════════
  // CLASSIFICAÇÃO
  // ══════════════════════════════════════════════════════════
  {
    id: 'classificacao',
    keywords: ['classificacao', 'ranking', 'funciona', 'sistema', 'pontuacao', 'criterio', 'xt', 'calcular'],
    response:
      '🎯 **Sistema XT** — o ranking é definido pela **soma de:**\n\n' +
      '> • Pontos de colocação\n' +
      '> • Eliminações (kills)',
  },
  {
    id: 'passa_final',
    keywords: ['passa', 'passam', 'classificar', 'avancar', 'final', 'quantas', 'equipes', 'top', 'vagas', 'avanca'],
    response:
      '📈 **Classificação para a Final:**\n\n' +
      '📅 **1ª Classificatória (08/07)** → Top 12 avançam\n' +
      '📅 **2ª Classificatória (09/07)** → Top 12 avançam\n\n' +
      '🏆 **Grande Final:** 24 equipes classificadas',
  },
  {
    id: 'equipes_final',
    keywords: ['quantas', 'equipes', 'times', 'final', 'total', '24', 'participar'],
    response:
      '👥 A **Grande Final** contará com **24 equipes** classificadas.\n\n' +
      '> 12 da 1ª Classificatória\n' +
      '> 12 da 2ª Classificatória',
  },

  // ══════════════════════════════════════════════════════════
  // INSCRIÇÃO
  // ══════════════════════════════════════════════════════════
  {
    id: 'inscricao_como',
    keywords: ['inscrever', 'inscricao', 'participar', 'entrar', 'como', 'ticket', 'abrir', 'cadastrar'],
    response:
      '🎫 Para se inscrever, abra um **ticket** no canal de inscrições e preencha a ficha com:\n\n' +
      '> Clã · TAG · Line · Manager\n' +
      '> Nick, UID e TikTok de cada jogador (P1 a P5)',
  },
  {
    id: 'inscricao_prazo',
    keywords: ['prazo', 'inscricao', 'inscricoes', 'encerra', 'fechar', 'limite', 'quando'],
    response:
      '📅 O prazo de inscrições é divulgado nos canais oficiais da **Oblivion League**.\n' +
      '🎫 Fique de olho nos anúncios e inscreva sua equipe com antecedência.',
  },
  {
    id: 'inscricao_jogadores',
    keywords: ['jogadores', 'quantos', 'squad', 'equipe', 'membros', 'integrantes', 'pessoas', 'composicao'],
    response:
      '👥 Cada equipe deve ter **3 titulares + reservas** (modo Squad, 4 jogam).\n\n' +
      '-# ℹ️ A inscrição aceita até 5 membros (3 titulares + 2 reservas).',
  },
  {
    id: 'lines_cla',
    keywords: ['lines', 'line', 'cla', 'quantas', 'mesmo', 'permitido', 'clan'],
    response: '⚔️ É permitido até **3 lines** por clã.',
  },

  // ══════════════════════════════════════════════════════════
  // UID / JOGADORES
  // ══════════════════════════════════════════════════════════
  {
    id: 'uid_prazo',
    keywords: ['uid', 'alterar', 'mudar', 'trocar', 'prazo', 'ate', 'limite', 'data'],
    response: '📅 Alterações de UID são permitidas até **10/07/2026 às 23h59**.\nApós esse prazo, nenhuma alteração será aceita.',
  },
  {
    id: 'uid_outro',
    keywords: ['uid', 'outro', 'diferente', 'jogar', 'usar', 'diferente'],
    response: '🚫 Não. O UID utilizado deve ser o **mesmo informado na inscrição**.',
  },
  {
    id: 'trocar_jogador',
    keywords: ['trocar', 'substituir', 'jogador', 'membro', 'reserva', 'sub', 'substituto'],
    response: '🎫 Entre em contato com a staff abrindo um **ticket** antes do prazo de alterações.',
  },
  {
    id: 'jogador_nao_cadastrado',
    keywords: ['nao', 'cadastrado', 'inscrito', 'fora', 'participar', 'jogar', 'substituto', 'diferente'],
    response:
      '🚫 Jogadores **não inscritos** não podem participar.\n' +
      '⚠️ Equipes com jogadores não cadastrados podem ser **desclassificadas**.\n' +
      '🎫 Para substituições, abra um **ticket** antes do prazo.',
  },

  // ══════════════════════════════════════════════════════════
  // TAG
  // ══════════════════════════════════════════════════════════
  {
    id: 'tag',
    keywords: ['tag', 'nome', 'apelido', 'nick', 'usar', 'obrigatorio', 'jogar', 'sem'],
    response: '🏷️ **Sim, é obrigatório.**\nTodos os jogadores devem utilizar a **TAG da equipe** durante a competição.',
  },
  {
    id: 'tag_diferente',
    keywords: ['tag', 'diferente', 'outra', 'outro', 'membro', 'igual', 'mesma'],
    response: '🚫 Não. **Toda a equipe** deve utilizar a **mesma TAG**.',
  },

  // ══════════════════════════════════════════════════════════
  // VERIFICAÇÃO / VÍDEOS
  // ══════════════════════════════════════════════════════════
  {
    id: 'gravar',
    keywords: ['gravar', 'gravacao', 'video', 'videos', 'precisa', 'obrigatorio', 'devo', 'filmagem'],
    response: '🎥 **Sim, é obrigatório.**\nTodos os jogadores devem gravar e enviar vídeos de verificação de **todas as quedas**.',
  },
  {
    id: 'qtd_videos',
    keywords: ['quantos', 'videos', 'enviar', 'mandar', 'quantidade', 'total', 'numero'],
    response:
      '🎞️ **4 vídeos** por jogador\n' +
      '🎞️ **16 vídeos** por equipe (total)',
  },
  {
    id: 'prazo_videos',
    keywords: ['prazo', 'quando', 'enviar', 'videos', 'limite', 'horas', 'madrugada', 'envio'],
    response: '⏰ Vídeos devem ser enviados até às **02h00 da manhã** após o encerramento do campeonato.',
  },
  {
    id: 'requisitos_video',
    keywords: ['aparece', 'mostrar', 'requisitos', 'video', 'precisa', 'hud', 'notificacao', 'horario', 'mostrar'],
    response:
      '📋 O vídeo deve mostrar:\n' +
      '> Barra de notificações\n' +
      '> Horário visível\n' +
      '> Aplicativos abertos\n' +
      '> HUD do jogo',
  },
  {
    id: 'abrir_tela',
    keywords: ['abrir', 'tela', 'screen', 'chamado', 'solicitado', 'staff', 'compartilhar'],
    response: '🖥️ Sim. A staff pode solicitar **abertura de tela** antes, durante ou após o campeonato.',
  },
  {
    id: 'recusar_verificacao',
    keywords: ['recusar', 'recusa', 'negar', 'obrigatorio', 'verificacao', 'consequencia', 'nao', 'quiser'],
    response: '⚠️ **Sim, é obrigatório.**\nA recusa pode resultar em **desclassificação e banimento**.',
  },

  // ══════════════════════════════════════════════════════════
  // DISCORD
  // ══════════════════════════════════════════════════════════
  {
    id: 'discord_obrigatorio',
    keywords: ['discord', 'entrar', 'obrigatorio', 'precisa', 'deve', 'estar', 'presente'],
    response: '✅ **Sim.**\nTodos os jogadores devem estar no Discord **antes do início das partidas** para conferência de lineup.',
  },
  {
    id: 'discord_call',
    keywords: ['call', 'voz', 'canal', 'discord', 'entrar', 'jogar', 'sem'],
    response: '⚠️ A staff usa o Discord para **verificações e conferência de lineup**.\nEstar no servidor é obrigatório.',
  },

  // ══════════════════════════════════════════════════════════
  // PROIBIÇÕES
  // ══════════════════════════════════════════════════════════
  {
    id: 'emulador',
    keywords: ['emulador', 'emuladores', 'pc', 'computador', 'bluestacks', 'ldplayer'],
    response: '🚫 **Não.** Emuladores são **proibidos**. Apenas dispositivos móveis.',
  },
  {
    id: 'mobilador',
    keywords: ['mobilador', 'mobiladores', 'controle', 'joystick', 'gamepad'],
    response: '🚫 **Não.** Mobiladores são **proibidos**.',
  },
  {
    id: 'vpn',
    keywords: ['vpn', 'rede', 'ping', 'usar', 'tunel'],
    response: '🚫 **Não.** VPN é **proibido** e resulta em **expulsão imediata**.',
  },
  {
    id: 'call_todos',
    keywords: ['call', 'todos', 'geral', 'campeonato', 'aberta', 'publica'],
    response: '🚫 **Não.** Call aberta para todos é **proibida** — resulta em **queda zerada**.',
  },
  {
    id: 'atropelar',
    keywords: ['atropelar', 'carro', 'veiculo', 'matar', 'bater'],
    response: '🚫 **Não.** Atropelar é **proibido** — resulta em **queda zerada**.',
  },
  {
    id: 'hack_trapaça',
    keywords: ['hack', 'hacker', 'trapaca', 'cheat', 'bug', 'exploit', 'aimbot', 'wallhack', 'macro'],
    response: '⛔ **Não.** Qualquer programa de trapaça resulta em **banimento permanente**.',
  },

  // ══════════════════════════════════════════════════════════
  // ARMAS
  // ══════════════════════════════════════════════════════════
  {
    id: 'armas_proibidas',
    keywords: ['armas', 'arma', 'proibidas', 'proibida', 'quais', 'permitida', 'bazuca', 'sniper', 'thumper', 'banidas'],
    response:
      '🔫 **Armas Proibidas:**\n\n' +
      '🚫 Munições especiais de sniper\n' +
      '🚫 Bazuca\n' +
      '🚫 Thumper\n' +
      '🚫 Tempestade\n' +
      '🚫 Aniquilador\n' +
      '🚫 Máquina de Guerra\n' +
      '🚫 Purificador\n\n' +
      '-# ℹ️ FHJ permitido apenas contra veículos.',
  },

  // ══════════════════════════════════════════════════════════
  // HABILIDADES
  // ══════════════════════════════════════════════════════════
  {
    id: 'habilidades_proibidas',
    keywords: ['habilidades', 'habilidade', 'skills', 'skill', 'proibidas', 'proibida', 'quais', 'banidas', 'lista'],
    response:
      '🚫 **Habilidades Proibidas:**\n\n' +
      '❌ Desperado\n' +
      '❌ Onda de Choque\n' +
      '❌ Desorientação\n' +
      '❌ Bombado\n' +
      '❌ Incendiário\n' +
      '❌ Todas as torretas\n' +
      '❌ Ataque de Dispersão',
  },
  {
    id: 'fhj',
    keywords: ['fhj', 'lançador', 'lanca', 'rocket', 'missil', 'contra', 'veiculo'],
    response:
      '✅ O **FHJ** é **permitido**, mas **apenas contra veículos**.\n' +
      '-# 🚫 Usar contra jogadores é proibido.',
  },

  // ══════════════════════════════════════════════════════════
  // VEÍCULOS
  // ══════════════════════════════════════════════════════════
  {
    id: 'veiculos_proibidos',
    keywords: ['veiculos', 'veiculo', 'carro', 'tanque', 'jato', 'moto', 'bike', 'proibidos', 'quais', 'voadora'],
    response:
      '🚗 **Veículos Proibidos:**\n\n' +
      '🚫 Caminhão\n' +
      '🚫 Tanque\n' +
      '🚫 Jato\n' +
      '🚫 Bike Voadora',
  },

  // ══════════════════════════════════════════════════════════
  // PONTUAÇÃO
  // ══════════════════════════════════════════════════════════
  {
    id: 'pts_kill',
    keywords: ['kill', 'kills', 'eliminacao', 'eliminacoes', 'vale', 'ponto', 'pontos', 'abate', 'matar'],
    response:
      '🩸 **Valor da Kill:**\n\n' +
      '🎯 Sem habilidades → **+1 ponto**\n' +
      '⚡ Com habilidades → **+2 pontos**',
  },
  {
    id: 'pts_colocacao',
    keywords: ['colocacao', 'lugar', 'posicao', 'primeiro', 'segundo', 'terceiro', 'campeao', 'pontos', 'tabela'],
    response:
      '🏅 **Pontuação por Colocação:**\n\n' +
      '🥇 1º — **15 pts**\n' +
      '🥈 2º — **13 pts**\n' +
      '🥉 3º — **11 pts**\n' +
      '4º — 9 pts · 5º — 7 pts · 6º — 5 pts\n' +
      '7º/8º — 3 pts · 9º–12º — 1 pt',
  },

  // ══════════════════════════════════════════════════════════
  // PENALIDADES
  // ══════════════════════════════════════════════════════════
  {
    id: 'penalidades_geral',
    keywords: ['pena', 'punicao', 'penalidade', 'consequencia', 'multa', 'desconto', 'punido'],
    response:
      '⚖️ **Tabela de Penalidades:**\n\n' +
      '🌐 VPN → Expulsão imediata\n' +
      '⛔ Trapaça → Banimento permanente\n' +
      '❌ Atropelar / Call geral → Queda zerada\n' +
      '➖ Armas ou habilidades proibidas → **−50 pontos**\n' +
      '⚠️ Briga no chat → Advertência / −50 pts',
  },
  {
    id: 'antidesportivo',
    keywords: ['antidesportivo', 'comportamento', 'toxico', 'xingar', 'ofender', 'briga', 'chat', 'grosseria'],
    response:
      '😡 Comportamento antidesportivo pode resultar em **expulsão**.\n\n' +
      '💬 Brigas no chat:\n' +
      '> 1ª ocorrência → ⚠️ Advertência\n' +
      '> 2ª ocorrência → ➖ **−50 pontos**',
  },

  // ══════════════════════════════════════════════════════════
  // CONFIGURAÇÕES
  // ══════════════════════════════════════════════════════════
  {
    id: 'reanimacao',
    keywords: ['reanimacao', 'reanimar', 'reviver', 'ressuscitar', 'automatica'],
    response: '❤️ **Sim.** O campeonato utiliza **Reanimação Automática**.',
  },
  {
    id: 'municao',
    keywords: ['municao', 'bala', 'infinita', 'acaba', 'falta', 'munição'],
    response: '♾️ **Sim.** A configuração é **Munição Infinita**.',
  },

  // ══════════════════════════════════════════════════════════
  // LINEUP / MANAGER
  // ══════════════════════════════════════════════════════════
  {
    id: 'lineup',
    keywords: ['lineup', 'conferencia', 'conferir', 'checar', 'verificar', 'antes', 'inicio'],
    response:
      '🔍 A staff realizará a **conferência de lineup** antes do início das partidas.\n' +
      '📲 Todos os jogadores devem estar no Discord no momento da verificação.',
  },
  {
    id: 'manager',
    keywords: ['manager', 'lider', 'responsavel', 'quem', 'representa', 'capitao', 'contato'],
    response:
      '👤 O **Manager** é o responsável oficial pela equipe.\n' +
      'Ele representa o clã e é o contato principal com a staff durante o campeonato.',
  },

  // ══════════════════════════════════════════════════════════
  // DENÚNCIAS
  // ══════════════════════════════════════════════════════════
  {
    id: 'denuncia',
    keywords: ['denuncia', 'denunciar', 'reportar', 'trapaca', 'hack', 'prova', 'reclamar', 'acusar'],
    response:
      '📸 Denúncias são aceitas **apenas mediante provas** (vídeo ou print).\n' +
      '🎫 Abra um **ticket** e envie as evidências para a staff analisar.',
  },

  // ══════════════════════════════════════════════════════════
  // TICKET
  // ══════════════════════════════════════════════════════════
  {
    id: 'ticket_duvida',
    keywords: ['ticket', 'abrir', 'contato', 'staff', 'falar', 'ajuda', 'problema', 'suporte'],
    response:
      '🎫 Para falar com a staff, abra um **ticket** no canal de inscrições.\n' +
      'Nossa equipe responderá o mais rápido possível.',
  },

  // ══════════════════════════════════════════════════════════
  // 😂 PERGUNTAS ENGRAÇADAS — RESPOSTAS ALEATÓRIAS
  // ══════════════════════════════════════════════════════════
  {
    id: 'funny_ganhar',
    funny: true,
    keywords: ['vamos', 'vou', 'equipe', 'ganhar', 'campeao', 'trofeu', 'primeiro', 'ganh'],
    responses: [
      '🔮 A bola de cristal diz: **talvez**. Ou não. Depende se a internet aguenta.',
      '📊 Probabilidade calculada: **muito baixa**. Mas coragem!',
      '🙏 Depende de quantas velas sua avó acendeu hoje.',
      '🎯 Sim! *(é o que todos os outros times também acham de si mesmos)*',
      '💪 Claro! Agora vai treinar em vez de perguntar pro bot.',
    ],
  },
  {
    id: 'funny_trapacar',
    funny: true,
    keywords: ['trapacear', 'trapacar', 'wallhack', 'fraquinho', 'pouquinho', 'aimbot', 'cheat', 'pequeno'],
    responses: [
      '⛔ NÃO. Nem 1 pixel de wallhack.',
      '🚫 "Fraquinho"... o banimento vai ser bem fortão, pode deixar.',
      '🔍 A staff agradece por se entregar antes mesmo de trapacear.',
      '😐 Interessante pergunta. A resposta é **BANIMENTO PERMANENTE**.',
    ],
  },
  {
    id: 'funny_net',
    funny: true,
    keywords: ['net', 'internet', 'cai', 'caiu', 'lag', 'ping', 'conexao', 'wifi', 'trava', 'lento'],
    responses: [
      '📡 Net caiu = problema seu. Recomenda-se usar cabo antes do campeonato.',
      '🛜 "A net caiu" — o clássico álibi desde 2009.',
      '😬 Infelizmente o campeonato não aceita desculpas em formato **.wifi**',
      '💀 Skill issue de infra. Paga a conta de internet antes de entrar.',
    ],
  },
  {
    id: 'funny_crash',
    funny: true,
    keywords: ['jogo', 'caiu', 'crashou', 'bugou', 'travou', 'fechou', 'sozinho', 'crash'],
    responses: [
      '📱 Limpa o cache e volta logo. O campeonato não pausa.',
      '😅 Que coincidência acontecer justamente na hora decisiva.',
      '🔧 Tenta reinstalar o jogo. Ou o celular. Ou a vida.',
      '🫠 O jogo sentiu o peso da responsabilidade e desmaiou igual ao time.',
    ],
  },
  {
    id: 'funny_arbitro',
    funny: true,
    keywords: ['arbitro', 'corrupto', 'injusto', 'roubado', 'parcial', 'favorito', 'combinado', 'injustico'],
    responses: [
      '😇 A staff é completamente imparcial. *(a staff aprovou essa mensagem)*',
      '⚖️ Se perdeu, foi skill issue. O regulamento é claro.',
      '🤐 Sem comentários. Se tiver provas, abre um ticket.',
      '👀 Muito corajoso perguntar isso aqui com todo mundo lendo.',
    ],
  },
  {
    id: 'funny_segredo',
    funny: true,
    keywords: ['segredo', 'dica', 'macete', 'truque', 'melhorar', 'como', 'vencer', 'formula'],
    responses: [
      '🏆 Segredo: **treinar**. Mas como você está aqui perguntando pro bot...',
      '🎯 1. Não use armas proibidas. 2. Não use VPN. 3. Reze. 4. Treine. 5. Repita.',
      '💡 A melhor dica é parar de pedir dica pro bot e ir praticar.',
      '🧠 Inteligência, comunicação e internet boa. Boa sorte com o último.',
    ],
  },
  {
    id: 'funny_pix',
    funny: true,
    keywords: ['pix', 'grana', 'dinheiro', 'rico', 'pagamento', 'cobrar', 'pagar', 'deposito'],
    responses: [
      '💸 O pix da OBL vai pro vencedor do campeonato. Vai lá ganhar.',
      '🤑 Boa iniciativa. Tem R$2.000 em jogo — bora jogar.',
      '🏦 Bot não tem conta bancária. Admiro o espírito empreendedor.',
      '😂 A chave pix é: **vai.ganhar.o.campeonato**',
    ],
  },
  {
    id: 'funny_banheiro',
    funny: true,
    keywords: ['banheiro', 'pausa', 'pausar', 'parar', 'intervalo', 'xixi', 'necessidade'],
    responses: [
      '🚽 O campeonato não pausa. Se planeje com antecedência.',
      '⏸️ Pausa não existe. Resolve antes das 20h ou aguenta.',
      '🧻 Conselho: resolva isso antes do início. Depois é guerra.',
      '😅 Questão filosófica importante. Resposta prática: não pode. Vai antes!',
    ],
  },
  {
    id: 'funny_acordo',
    funny: true,
    keywords: ['acordo', 'combinar', 'dividir', 'acertar', 'combinado', 'metade', 'dividir'],
    responses: [
      '😶 Não faço parte de acordos. A staff também não aprova.',
      '🤝 Resultado combinado = desclassificação. Mas sinta-se à vontade.',
      '👀 Aqui? Nesse canal? Com todo mundo lendo? **Muito corajoso.**',
      '🚫 Isso é manipulação de resultado. Próxima dúvida.',
    ],
  },
  {
    id: 'funny_melhor_player',
    funny: true,
    keywords: ['melhor', 'player', 'pro', 'profissional', 'top', 'rank', 'quem', 'numero'],
    responses: [
      '🏆 O melhor jogador é aquele que não pergunta pro bot quem é o melhor.',
      '🎮 Depende de quem for pegar o MVP no final.',
      '😌 Com certeza não é quem está aqui no FAQ em vez de treinar.',
      '👑 Boa pergunta. A resposta estará no ranking após o campeonato.',
    ],
  },
  {
    id: 'funny_bot',
    funny: true,
    keywords: ['bot', 'burro', 'inteligente', 'voce', 'robot', 'ia', 'artificial', 'funciona', 'otimo'],
    responses: [
      '🤖 Sou o bot mais inteligente desse servidor. Concorrência baixa.',
      '💡 Funciono perfeitamente. Essa pergunta é que foi difícil.',
      '😤 Burro? Eu soube responder essa pergunta. E você, soube fazer?',
      '🧠 Processo linguagem natural, banco de dados e crise existencial ao mesmo tempo.',
      '🤷 Me pergunta algo sobre o regulamento que eu brilho mais.',
    ],
  },
  {
    id: 'funny_rival',
    funny: true,
    keywords: ['rival', 'adversario', 'ruins', 'fracos', 'facil', 'fraco', 'lixo', 'faceis'],
    responses: [
      '😶 Com certeza. *É o que todos pensam antes de perder.*',
      '📊 Pelo menos metade dos times vai perder. Inclusive o seu.',
      '🎯 Se são ruins, vai ser fácil. Então para de perguntar e vai jogar.',
      '😅 Toda derrota tem uma boa história de "eram bot mesmo".',
    ],
  },
  {
    id: 'funny_sorte',
    funny: true,
    keywords: ['sorte', 'azar', 'destino', 'rng', 'aleatorio', 'chance', 'deus', 'orar', 'reza'],
    responses: [
      '🍀 Sorte? No Battle Royale é tudo RNG. Menos as kills. Essas são skill.',
      '🎲 O RNG vai estar ao seu lado... ou não. Trata bem o universo.',
      '🙏 Recomendamos: rezar, pagar promessa e não usar VPN.',
      '🌌 O cosmos é indiferente ao seu lobby de classificatória.',
    ],
  },
  {
    id: 'funny_bebado',
    funny: true,
    keywords: ['bebado', 'bebedo', 'alcool', 'cerveja', 'bebendo', 'beber', 'chapado', 'bebida'],
    responses: [
      '🍺 Não é proibido pelo regulamento. Resultado: problema seu.',
      '😶 Alguns jogam melhor assim. Outros mandam a lineup pro time errado.',
      '🎯 Boa sorte. Vai precisar de bastante.',
      '🫡 O regulamento é silencioso sobre isso. O desempenho, não.',
    ],
  },
  {
    id: 'funny_perder',
    funny: true,
    keywords: ['perder', 'perdemos', 'perdeu', 'eliminado', 'caimos', 'eliminacao', 'caiu', 'morreu'],
    responses: [
      '😔 Acontece. Até os melhores times perdem... só que menos vezes.',
      '💪 O que não mata fortalece. Até a próxima classificatória!',
      '📈 Derrota hoje = aprendizado para o próximo. Vai treinar!',
      '🎯 Faz parte. O importante é analisar o que errou e voltar mais forte.',
      '🤝 Pelo menos vocês não usaram VPN. Isso já é alguma coisa.',
    ],
  },
];

// ─── Matching ─────────────────────────────────────────────────────────────────

const THRESHOLD = 0.22;

function scoreEntry(entry, tokens) {
  const kwSet = entry.keywords.map(k => normalize(k));
  let hits = 0;
  for (const token of tokens) {
    if (kwSet.some(kw => kw === token || kw.includes(token) || token.includes(kw))) {
      hits++;
    }
  }
  return hits / Math.max(tokens.length, 1);
}

/**
 * match(question) → { entry, score, evasion: bool } | null
 *
 * Camadas de inteligência (por prioridade):
 *  1. Ações proibidas — sempre retorna a resposta de proibição, qualquer que seja o framing
 *  2. Detecção de evasão — marca a resposta com flag `evasion: true`
 *  3. Remoção de negação — "VPN não é proibida?" trata como "VPN proibida"
 *  4. Expansão de sinônimos — "bluestacks", "aimbot" etc. mapeados ao canônico
 *  5. Keyword matching melhorado com threshold reduzido
 */
function match(question) {
  const norm    = normalize(question);
  const isEvasion = detectEvasion(norm);

  // ── 1. Ações proibidas: framing não muda a resposta ───────────────────────
  const rawTokens = tokenize(norm);
  const synTokens = applySynonyms(rawTokens);
  const prohibitedId = matchProhibited(synTokens);

  if (prohibitedId) {
    const entry = FAQ_DB.find(e => e.id === prohibitedId);
    if (entry) return { entry, score: 1, evasion: isEvasion };
  }

  // ── 2. Remoção de negação + sinônimos para matching geral ─────────────────
  const stripped  = stripNegation(norm);
  const tokens    = applySynonyms(tokenize(stripped));
  if (tokens.length === 0) return null;

  let best      = null;
  let bestScore = 0;

  for (const entry of FAQ_DB) {
    const score = scoreEntry(entry, tokens);
    if (score > bestScore) {
      bestScore = score;
      best      = entry;
    }
  }

  if (bestScore >= THRESHOLD && best) {
    return { entry: best, score: bestScore, evasion: isEvasion };
  }

  // ── 3. Fallback com tokens originais (sem remoção de negação) ─────────────
  let best2      = null;
  let bestScore2 = 0;
  const rawSyn = applySynonyms(rawTokens);
  for (const entry of FAQ_DB) {
    const score = scoreEntry(entry, rawSyn);
    if (score > bestScore2) { bestScore2 = score; best2 = entry; }
  }

  if (bestScore2 >= THRESHOLD && best2) {
    return { entry: best2, score: bestScore2, evasion: isEvasion };
  }

  return isEvasion ? { entry: null, score: 0, evasion: true } : null;
}

module.exports = { match, getResponse, FAQ_DB, normalize, detectEvasion };
