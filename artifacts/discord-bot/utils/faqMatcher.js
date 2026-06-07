// ─── Normalização de texto ────────────────────────────────────────────────────

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove acentos
    .replace(/[^a-z0-9\s]/g, ' ')      // remove pontuação
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  const STOP = new Set([
    'a', 'as', 'o', 'os', 'e', 'eh', 'de', 'do', 'da', 'dos', 'das',
    'no', 'na', 'nos', 'nas', 'em', 'um', 'uma', 'uns', 'umas', 'para',
    'por', 'com', 'que', 'se', 'ja', 'me', 'te', 'eu', 'tu', 'ele',
    'ela', 'nos', 'vo', 'foi', 'ser', 'tem', 'ter', 'vai', 'vou',
    'sao', 'era', 'ate', 'ao', 'aos', 'ou', 'pra', 'isso',
  ]);
  return normalize(text).split(' ').filter(t => t.length > 1 && !STOP.has(t));
}

// ─── Base de perguntas e respostas ────────────────────────────────────────────

const FAQ_DB = [
  // ── Cronograma ──────────────────────────────────────────────────────────────
  {
    id: 'class1',
    keywords: ['primeira', '1', '1a', 'primeiro', 'classificatoria', 'quando', 'data', 'dia', 'horario'],
    response:
      '📅 A **1ª Classificatória** acontecerá em **08/07/2026** às **20h00**.',
  },
  {
    id: 'class2',
    keywords: ['segunda', '2', '2a', 'segundo', 'classificatoria', 'quando', 'data', 'dia', 'horario'],
    response:
      '📅 A **2ª Classificatória** acontecerá em **09/07/2026** às **20h00**.',
  },
  {
    id: 'final',
    keywords: ['final', 'grande', 'quando', 'dia', 'data', 'horario', 'hora'],
    response:
      '🏆 A **Grande Final** acontecerá em **11/07/2026** às **22h00**.',
  },
  {
    id: 'duracao',
    keywords: ['dias', 'dura', 'quantos', 'campeonato', 'duracao', 'periodo'],
    response:
      '📅 O campeonato será realizado nos dias **08**, **09** e **11 de julho de 2026**.',
  },

  // ── Premiação ───────────────────────────────────────────────────────────────
  {
    id: 'premiacao_geral',
    keywords: ['premiacao', 'premio', 'premios', 'quanto', 'ganha', 'valor', 'dinheiro', 'reais', 'pagar', 'receber'],
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
    keywords: ['mvp', 'melhor', 'jogador', 'individual', 'premiacao'],
    response:
      '🏅 Sim! O **MVP** receberá **R$ 50,00**.',
  },

  // ── Formato ─────────────────────────────────────────────────────────────────
  {
    id: 'modo',
    keywords: ['modo', 'squad', 'tipo', 'formato', 'jogadores', 'equipe', 'time'],
    response:
      '👥 O campeonato será disputado no modo **Squad**.',
  },
  {
    id: 'quedas',
    keywords: ['quedas', 'quantas', 'rodadas', 'partidas', 'games', 'rounds'],
    response:
      '🎯 **Classificatórias:** 3 quedas por dia.\n🏆 **Grande Final:** 4 quedas.',
  },
  {
    id: 'mapas',
    keywords: ['mapas', 'mapa', 'qual', 'onde', 'isolated', 'blackout'],
    response:
      '🗺️ Os mapas utilizados serão **Isolated** e **Blackout**.',
  },
  {
    id: 'habilidades_formato',
    keywords: ['habilidade', 'habilidades', 'skill', 'skills', 'ativa', 'ativas', 'usar', 'vai', 'tem'],
    response:
      '⚡ Sim, haverá quedas com habilidades na Final.\n\n' +
      '🏆 **Grande Final:**\n' +
      '> 2 quedas com habilidades\n' +
      '> 2 quedas sem habilidades',
  },

  // ── Classificação ───────────────────────────────────────────────────────────
  {
    id: 'classificacao',
    keywords: ['classificacao', 'ranking', 'funciona', 'sistema', 'pontuacao', 'criterio', 'xt'],
    response:
      '🎯 **Sistema XT**\n\n' +
      '📊 O ranking é definido pela **soma de:**\n' +
      '> • Pontos de colocação\n' +
      '> • Eliminações (kills)',
  },
  {
    id: 'passa_final',
    keywords: ['passa', 'passam', 'classificar', 'avancar', 'ir', 'final', 'quantas', 'equipes', 'top', 'vagas'],
    response:
      '📈 **Classificação para a Final:**\n\n' +
      '📅 **1ª Classificatória (08/07)** → Top 12 avançam\n' +
      '📅 **2ª Classificatória (09/07)** → Top 12 avançam\n\n' +
      '🏆 **Grande Final:** 24 equipes classificadas',
  },
  {
    id: 'equipes_final',
    keywords: ['quantas', 'equipes', 'times', 'final', 'total', '24'],
    response:
      '👥 A **Grande Final** contará com **24 equipes** classificadas.\n\n' +
      '> 12 da 1ª Classificatória\n' +
      '> 12 da 2ª Classificatória',
  },

  // ── Inscrição / UID ─────────────────────────────────────────────────────────
  {
    id: 'uid_prazo',
    keywords: ['uid', 'alterar', 'mudar', 'trocar', 'quando', 'prazo', 'ate', 'limite'],
    response:
      '📅 Alterações de UID são permitidas até **10/07/2026 às 23h59**.\nApós esse prazo, nenhuma alteração será aceita.',
  },
  {
    id: 'uid_outro',
    keywords: ['uid', 'outro', 'diferente', 'jogar', 'usar', 'pode'],
    response:
      '🚫 Não. O UID utilizado deve ser o **mesmo informado na inscrição**.',
  },
  {
    id: 'trocar_jogador',
    keywords: ['trocar', 'substituir', 'jogador', 'membro', 'reserva', 'sub'],
    response:
      '🎫 Entre em contato com a staff abrindo um **ticket**.',
  },

  // ── TAG ─────────────────────────────────────────────────────────────────────
  {
    id: 'tag',
    keywords: ['tag', 'nome', 'apelido', 'nick', 'usar', 'obrigatorio', 'pode', 'jogar', 'sem'],
    response:
      '🏷️ **Sim, é obrigatório.**\nTodos os jogadores devem utilizar a **TAG da equipe** durante a competição.',
  },
  {
    id: 'tag_diferente',
    keywords: ['tag', 'diferente', 'outra', 'outro', 'membro', 'igual'],
    response:
      '🚫 Não. **Toda a equipe** deve utilizar a **mesma TAG**.',
  },

  // ── Verificação ─────────────────────────────────────────────────────────────
  {
    id: 'gravar',
    keywords: ['gravar', 'gravacao', 'video', 'videos', 'precisa', 'obrigatorio', 'devo'],
    response:
      '🎥 **Sim, é obrigatório.**\nTodos os jogadores devem enviar vídeos de verificação de todas as quedas.',
  },
  {
    id: 'qtd_videos',
    keywords: ['quantos', 'videos', 'enviar', 'mandar', 'quantidade', 'total'],
    response:
      '🎞️ **4 vídeos** por jogador\n🎞️ **16 vídeos** por equipe (total)',
  },
  {
    id: 'prazo_videos',
    keywords: ['prazo', 'ate', 'quando', 'enviar', 'videos', 'limite', 'horas', 'madrugada'],
    response:
      '⏰ Até às **02h00 da manhã** após o encerramento do campeonato.',
  },
  {
    id: 'requisitos_video',
    keywords: ['aparece', 'mostrar', 'requisitos', 'video', 'precisa', 'hud', 'notificacao', 'horario'],
    response:
      '📋 O vídeo deve mostrar:\n' +
      '> Barra de notificações\n' +
      '> Horário\n' +
      '> Aplicativos abertos\n' +
      '> HUD',
  },
  {
    id: 'abrir_tela',
    keywords: ['abrir', 'tela', 'screen', 'chamado', 'solicitado', 'staff', 'pode', 'pedir'],
    response:
      '🖥️ Sim. A staff pode solicitar **abertura de tela** antes, durante ou após o campeonato.',
  },
  {
    id: 'recusar_verificacao',
    keywords: ['recusar', 'recusa', 'negar', 'obrigado', 'obrigatorio', 'verificacao', 'consequencia'],
    response:
      '⚠️ **Sim, é obrigatório.**\nA recusa pode resultar em **desclassificação e banimento**.',
  },

  // ── Discord ─────────────────────────────────────────────────────────────────
  {
    id: 'discord_obrigatorio',
    keywords: ['discord', 'entrar', 'obrigatorio', 'precisa', 'deve', 'estar', 'presente'],
    response:
      '✅ **Sim.**\nTodos os jogadores devem estar presentes no Discord **antes do início das partidas**.',
  },
  {
    id: 'discord_call',
    keywords: ['call', 'voz', 'canal', 'discord', 'entrar', 'jogar', 'sem'],
    response:
      '⚠️ Não é recomendado.\nA staff pode usar o Discord para **verificações e conferência de lineup**.',
  },

  // ── Proibições ───────────────────────────────────────────────────────────────
  {
    id: 'emulador',
    keywords: ['emulador', 'emuladores', 'pc', 'computador', 'pode'],
    response:
      '🚫 **Não.** Emuladores são **proibidos**.',
  },
  {
    id: 'mobilador',
    keywords: ['mobilador', 'mobiladores', 'mobile', 'controle', 'pode'],
    response:
      '🚫 **Não.** Mobiladores são **proibidos**.',
  },
  {
    id: 'vpn',
    keywords: ['vpn', 'rede', 'ping', 'pode', 'usar'],
    response:
      '🚫 **Não.** VPN é **proibido** e resulta em **expulsão imediata**.',
  },
  {
    id: 'call_todos',
    keywords: ['call', 'todos', 'geral', 'campeonato', 'pode'],
    response:
      '🚫 **Não.** Call para todos é **proibido** — resulta em **queda zerada**.',
  },
  {
    id: 'atropelar',
    keywords: ['atropelar', 'carro', 'veiculo', 'matar', 'pode'],
    response:
      '🚫 **Não.** Atropelar é **proibido** — resulta em **queda zerada**.',
  },
  {
    id: 'hack_trapaça',
    keywords: ['hack', 'hacker', 'trapaca', 'cheat', 'bug', 'exploit', 'aimbot', 'wallhack'],
    response:
      '⛔ **Não.** Qualquer programa de trapaça resulta em **banimento permanente**.',
  },

  // ── Armas ────────────────────────────────────────────────────────────────────
  {
    id: 'armas_proibidas',
    keywords: ['armas', 'arma', 'proibidas', 'proibida', 'quais', 'usar', 'permitida', 'bazuca', 'sniper', 'thumper'],
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

  // ── Habilidades ──────────────────────────────────────────────────────────────
  {
    id: 'habilidades_proibidas',
    keywords: ['habilidades', 'habilidade', 'skills', 'skill', 'proibidas', 'proibida', 'quais', 'usar', 'ativas'],
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

  // ── Veículos ─────────────────────────────────────────────────────────────────
  {
    id: 'veiculos_proibidos',
    keywords: ['veiculos', 'veiculo', 'carro', 'tanque', 'jato', 'moto', 'bike', 'proibidos', 'proibido', 'quais'],
    response:
      '🚗 **Veículos Proibidos:**\n\n' +
      '🚫 Caminhão\n' +
      '🚫 Tanque\n' +
      '🚫 Jato\n' +
      '🚫 Bike Voadora',
  },

  // ── Penalidades ───────────────────────────────────────────────────────────────
  {
    id: 'pena_vpn',
    keywords: ['pena', 'punicao', 'vpn', 'banido', 'expulso', 'consequencia'],
    response:
      '🌐 Uso de VPN → **Expulsão imediata**.',
  },
  {
    id: 'pena_hack',
    keywords: ['pena', 'punicao', 'hack', 'trapaca', 'banimento', 'consequencia'],
    response:
      '⛔ Uso de trapaças → **Banimento permanente**.',
  },
  {
    id: 'pena_armas',
    keywords: ['pena', 'punicao', 'armas', 'proibidas', 'consequencia', 'pontos', 'perder'],
    response:
      '➖ Uso de armas proibidas → **−50 pontos**.',
  },
  {
    id: 'pena_habilidades',
    keywords: ['pena', 'punicao', 'habilidades', 'proibidas', 'consequencia', 'pontos'],
    response:
      '➖ Uso de habilidades proibidas → **−50 pontos**.',
  },
  {
    id: 'pena_atropelar',
    keywords: ['pena', 'punicao', 'atropelar', 'carro', 'consequencia'],
    response:
      '❌ Atropelar → **Queda zerada**.',
  },
  {
    id: 'pena_call',
    keywords: ['pena', 'punicao', 'call', 'todos', 'geral', 'consequencia'],
    response:
      '❌ Call para todos → **Queda zerada**.',
  },

  // ── Pontuação ─────────────────────────────────────────────────────────────────
  {
    id: 'pts_kill',
    keywords: ['kill', 'kills', 'eliminacao', 'eliminacoes', 'vale', 'ponto', 'pontos', 'abate'],
    response:
      '🩸 **Valor da Kill:**\n\n' +
      '🎯 Sem habilidades → **+1 ponto**\n' +
      '⚡ Com habilidades → **+2 pontos**',
  },
  {
    id: 'pts_1lugar',
    keywords: ['primeiro', '1', '1o', 'lugar', 'vale', 'ponto', 'pontos', 'campeao'],
    response:
      '🥇 **1º Lugar** = **15 pontos**.',
  },
  {
    id: 'pts_2lugar',
    keywords: ['segundo', '2', '2o', 'lugar', 'vale', 'ponto', 'pontos'],
    response:
      '🥈 **2º Lugar** = **13 pontos**.',
  },
  {
    id: 'pts_3lugar',
    keywords: ['terceiro', '3', '3o', 'lugar', 'vale', 'ponto', 'pontos'],
    response:
      '🥉 **3º Lugar** = **11 pontos**.',
  },

  // ── Inscrição ─────────────────────────────────────────────────────────────────
  {
    id: 'inscricao_como',
    keywords: ['inscrever', 'inscricao', 'participar', 'entrar', 'como', 'ticket', 'abrir'],
    response:
      '🎫 Para se inscrever, abra um **ticket** no canal de inscrições.\n\n' +
      'Preencha a ficha com:\n' +
      '> Clã · TAG · Line · Manager\n' +
      '> Nome e UID de cada jogador (P1 a P5)',
  },
  {
    id: 'inscricao_prazo',
    keywords: ['prazo', 'inscricao', 'inscricoes', 'encerra', 'fechar', 'limite', 'ate'],
    response:
      '📅 O prazo de inscrições é divulgado nos canais oficiais da **Oblivion League**.\n' +
      '🎫 Fique de olho nos anúncios e inscreva sua equipe com antecedência.',
  },
  {
    id: 'inscricao_jogadores',
    keywords: ['jogadores', 'quantos', 'squad', 'equipe', 'membros', 'integrantes', 'pessoas'],
    response:
      '👥 Cada equipe é composta por **4 jogadores** (modo Squad).\n\n' +
      '-# ℹ️ A inscrição deve conter o nome e UID de todos os membros.',
  },

  // ── Lines / Clã ───────────────────────────────────────────────────────────────
  {
    id: 'lines_cla',
    keywords: ['lines', 'line', 'cla', 'quantas', 'equipes', 'mesmo', 'permitido'],
    response:
      '⚔️ É permitido até **3 lines** por clã.',
  },
  {
    id: 'manager',
    keywords: ['manager', 'lider', 'responsavel', 'quem', 'representa', 'capiao', 'capitao'],
    response:
      '👤 O **Manager** é o responsável pela equipe.\n' +
      'Ele representa o clã e é o contato oficial com a staff durante o campeonato.',
  },

  // ── Configurações ─────────────────────────────────────────────────────────────
  {
    id: 'reanimacao',
    keywords: ['reanimacao', 'reanimar', 'reviver', 'ressuscitar', 'automatica'],
    response:
      '❤️ **Sim.** O campeonato utiliza **Reanimação Automática**.',
  },
  {
    id: 'municao',
    keywords: ['municao', 'bala', 'infinita', 'acaba', 'falta'],
    response:
      '♾️ **Sim.** A configuração é **Munição Infinita**.',
  },
  {
    id: 'fhj',
    keywords: ['fhj', 'lançador', 'lanca', 'rocket', 'launcher', 'missil', 'contra', 'veiculo'],
    response:
      '✅ O **FHJ** é **permitido**, mas **apenas contra veículos**.\n' +
      '-# 🚫 Usar contra jogadores é proibido.',
  },

  // ── Denúncias ─────────────────────────────────────────────────────────────────
  {
    id: 'denuncia',
    keywords: ['denuncia', 'denunciar', 'reportar', 'trapaça', 'trapaca', 'hack', 'prova', 'reclamar'],
    response:
      '📸 Denúncias são aceitas **apenas mediante provas** (vídeo ou print).\n' +
      '🎫 Abra um **ticket** e envie as evidências para a staff analisar.',
  },

  // ── Comportamento ─────────────────────────────────────────────────────────────
  {
    id: 'antidesportivo',
    keywords: ['antidesportivo', 'comportamento', 'tóxico', 'toxico', 'xingar', 'ofender', 'briga'],
    response:
      '😡 Comportamento antidesportivo resulta em **expulsão do campeonato**.\n' +
      '💬 Brigas no chat:\n' +
      '> 1ª ocorrência → ⚠️ Advertência\n' +
      '> 2ª ocorrência → ➖ **−50 pontos**',
  },

  // ── Lineup ────────────────────────────────────────────────────────────────────
  {
    id: 'lineup',
    keywords: ['lineup', 'conferencia', 'conferir', 'checar', 'verificar', 'antes', 'inicio'],
    response:
      '🔍 A staff realizará a **conferência de lineup** antes do início das partidas.\n' +
      '📲 Todos os jogadores devem estar presentes no Discord no momento da verificação.',
  },
  {
    id: 'jogador_nao_cadastrado',
    keywords: ['nao', 'cadastrado', 'inscrito', 'fora', 'participar', 'jogar', 'substituto'],
    response:
      '🚫 Jogadores **não inscritos** não podem participar.\n' +
      '⚠️ Equipes com jogadores não cadastrados podem ser **desclassificadas**.\n' +
      '🎫 Para substituições, abra um **ticket** antes do prazo.',
  },

  // ── Ticket ────────────────────────────────────────────────────────────────────
  {
    id: 'ticket_duvida',
    keywords: ['ticket', 'abrir', 'contato', 'staff', 'falar', 'ajuda', 'problema'],
    response:
      '🎫 Para falar com a staff, abra um **ticket** no canal de inscrições.\n' +
      'Nossa equipe responderá o mais rápido possível.',
  },
];

// ─── Função de matching ───────────────────────────────────────────────────────

const THRESHOLD = 0.30;

function match(question) {
  const tokens = tokenize(question);
  if (tokens.length === 0) return null;

  let best = null;
  let bestScore = 0;

  for (const entry of FAQ_DB) {
    const kwSet = entry.keywords.map(k => normalize(k));
    let hits = 0;
    for (const token of tokens) {
      if (kwSet.some(kw => kw === token || kw.includes(token) || token.includes(kw))) {
        hits++;
      }
    }
    const score = hits / Math.max(tokens.length, 1);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (bestScore >= THRESHOLD && best) {
    return { entry: best, score: bestScore };
  }
  return null;
}

module.exports = { match, FAQ_DB, normalize };
