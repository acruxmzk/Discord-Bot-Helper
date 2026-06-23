/**
 * postArasaka.js — Script de postagem única
 * Posta as tabelas de resultados da Line Arasaka num canal Discord.
 * Executar com: node artifacts/discord-bot/scripts/postArasaka.js
 */

const {
  Client,
  GatewayIntentBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ChannelType,
  AttachmentBuilder,
} = require('discord.js');
const path = require('path');

const ASSETS = path.join(__dirname, '..', '..', '..', 'attached_assets');

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = (c) => new TextDisplayBuilder().setContent(c);

// ─── Dados completos — ordenados por data ─────────────────────────────────────
// kills: número de kills do jogo (não PT Kill)
// pontos: pontuação final do torneio
// lugar: colocação (1 = 1º, 2 = 2º, etc.)
// arquivo: nome do arquivo em attached_assets/
const TORNEIOS = [
  // ── Com data (banco anterior — sessão 16/06) ────────────────────────────────
  {
    data: '26/05/2026', torneio: 'Andromeda Torneio · Fase 3',
    lugar: 1, kills: 139, pontos: 169,
    arquivo: '78f078e0-8620-4750-81f6-2d777778e186_1781585683756.jpeg',
  },
  {
    data: '31/05/2026', torneio: 'Xtreino Deuses do Egito',
    lugar: 1, kills: 134, pontos: 770,
    arquivo: 'e733ee48-3af0-4873-9233-a5eee22901aa_1781585683756.jpeg',
  },
  {
    data: '02/06/2026', torneio: 'X-Treino Shark · Modo Squad',
    lugar: 1, kills: 144, pontos: 1550,
    arquivo: 'd839d28f-98f6-413c-a4c5-f188ab30049f_1781585683756.jpeg',
  },
  {
    data: '05/06/2026', torneio: 'Xtreino Invictus · Modo Squad',
    lugar: 1, kills: 150, pontos: 1510,
    arquivo: 'edca3869-3696-42ce-ac63-b533b3e8bfb9_1781585683756.jpeg',
  },
  {
    data: '08/06/2026', torneio: 'Arena Premiada · Divine in Pact',
    lugar: 1, kills: 153, pontos: 1710,
    arquivo: '18bd1589-6c81-40e2-abdc-9c809b87cad1_1781585683756.jpeg',
  },
  {
    data: '09/06/2026', torneio: 'X-Treino Shark · Modo Squad',
    lugar: 1, kills: 155, pontos: 1730,
    arquivo: '6cddcf6f-ffcf-439c-a6a3-dbe2966c1996_1781585683756.jpeg',
  },
  {
    data: '15/06/2026', torneio: 'Arena Premiada · Divine in Pact',
    lugar: 1, kills: 127, pontos: 1500,
    arquivo: 'fdab26de-8c32-4a13-b9b2-7a45f84f49fc_1781585683756.jpeg',
  },
  {
    data: '17/06/2026', torneio: 'XT-Kingslayers Eclipse',
    lugar: 1, kills: 106, pontos: 1155,
    arquivo: '31dc6a60-860d-4132-8d23-1d1d1b82391c_1782185227958.jpeg',
  },
  {
    data: '20/06/2026', torneio: 'Torneio Baixada 13',
    lugar: 1, kills: 106, pontos: 1290,
    arquivo: '22976ce5-e5f1-4c50-8e8a-fb775e4bb2cc_1782185227958.jpeg',
  },
  {
    data: '20/06/2026', torneio: 'X-Treino Gueto',
    lugar: 1, kills: 156, pontos: 1660,
    arquivo: '5101959D-C630-4BE1-B126-A0C24CE0BEA3_1782185227958.jpeg',
  },
  // ── Sem data confirmada ────────────────────────────────────────────────────
  {
    data: null, torneio: 'Torneio Baixada 13 · 2ª Etapa',
    lugar: 1, kills: 150, pontos: 1770,
    arquivo: 'IMG_5590_1781585683756.jpeg',
  },
  {
    data: null, torneio: 'Torneio Tribruxo',
    lugar: 1, kills: 136, pontos: 1470,
    arquivo: 'a1469000-ba14-488a-a4a1-d59ade8ba744_1781585683756.jpeg',
  },
  {
    data: null, torneio: 'X-Treino Frontier · Quinta 22h',
    lugar: 2, kills: 110, pontos: 1135,
    arquivo: '14f6d047-608f-414c-a089-e0b73a0487ea_1781585683756.jpeg',
  },
  {
    data: null, torneio: 'X-Treino da Resistência (Edição A)',
    lugar: 1, kills: null, pontos: 980,
    obs: 'PT Kill: 186 · PT Rank: 50',
    arquivo: '63f41bbf-c9c2-4600-a8e7-b1fcea71960e_1781585683756.jpeg',
  },
  {
    data: null, torneio: 'Xtreino Colíseu',
    lugar: 1, kills: 164, pontos: 2550,
    arquivo: '715fa996-c660-43f4-b55b-d9e6815ce4f1_1782185227957.jpeg',
  },
  {
    data: null, torneio: 'X-Treino Frontier · Quinta 22h (Edição B)',
    lugar: 1, kills: 130, pontos: 1395,
    arquivo: '0230bff9-91b1-49c1-a353-39ee353dcd9f_1782185227958.jpeg',
  },
  {
    data: null, torneio: 'X-Treino da Resistência (Edição B)',
    lugar: 1, kills: null, pontos: 825,
    obs: 'PT Kill: 155 · PT Rank: 50',
    arquivo: '5a55538e-fb0b-4805-a576-b83be3285c2a_1782185227958.jpeg',
  },
  {
    data: null, torneio: 'X-Treino Resistência Winners · 2ª Queda',
    lugar: 1, kills: 60, pontos: null,
    arquivo: 'ed716ce3-c274-4c3d-9ff4-301d4284236f_1782185227958.jpeg',
  },
  {
    data: null, torneio: 'Torneio Tribruxo Winners · Queda 1',
    lugar: 1, kills: 61, pontos: null,
    arquivo: 'd32f4be1-edcb-4fbd-8bb6-460f34eafbcb_1782185227958.jpeg',
  },
  {
    data: null, torneio: 'Torneio Tribruxo Winners · Queda 2',
    lugar: 1, kills: 49, pontos: null,
    arquivo: '8e61f5c1-b56b-482a-9ced-fec060bbddcd_1782185227958.jpeg',
  },
];

// ─── Totais ───────────────────────────────────────────────────────────────────
const totalKills  = TORNEIOS.reduce((s, r) => s + (r.kills ?? 0), 0);
const totalPontos = TORNEIOS.reduce((s, r) => s + (r.pontos ?? 0), 0);
const vitorias    = TORNEIOS.filter(r => r.lugar === 1).length;
const medals      = ['🥇', '🥈', '🥉'];

// ─── Buscar canal ─────────────────────────────────────────────────────────────
const CANAL_PATTERNS = [
  'arasaka', 'resultados-arasaka', 'resultados', 'x-treinos', 'treinos',
  'resultados-xtreinos', 'historico', 'historico-arasaka',
];

function normCh(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

function findChannel(guild) {
  // 1. Procura pelo padrão ideal
  for (const pat of CANAL_PATTERNS) {
    const found = guild.channels.cache.find(
      c => c.type === ChannelType.GuildText && normCh(c.name).includes(normCh(pat))
    );
    if (found) return found;
  }
  // 2. Fallback: primeiro canal de texto
  return guild.channels.cache.find(c => c.type === ChannelType.GuildText) ?? null;
}

// ─── Postar ───────────────────────────────────────────────────────────────────
async function postar(channel) {
  console.log(`[ARASAKA] Postando em #${channel.name} (${channel.guild.name})`);

  // 1. Cabeçalho
  await channel.send({
    components: [
      new ContainerBuilder()
        .setAccentColor(0xFFD700)
        .addTextDisplayComponents(txt(
          `## ⚔️ OBLIVION · LINE ARASAKA\n` +
          `### 📋 Tabela Completa de Resultados — X-Treinos & Torneios\n` +
          `-# ${TORNEIOS.length} torneios registrados · Kills totais: **${totalKills.toLocaleString('pt-BR')}** · Pontos totais: **${totalPontos.toLocaleString('pt-BR')}**`
        )),
    ],
    flags: MessageFlags.IsComponentsV2,
  });

  // 2. Cada torneio: imagem + container
  for (let i = 0; i < TORNEIOS.length; i++) {
    const r        = TORNEIOS[i];
    const medal    = medals[r.lugar - 1] ?? `**${r.lugar}º**`;
    const dataStr  = r.data ?? '📌 Data não confirmada';
    const killsStr = r.kills != null ? `${r.kills} kills` : r.obs ?? '—';
    const ptsStr   = r.pontos != null ? `${r.pontos.toLocaleString('pt-BR')} pts` : '—';
    const cor      = r.lugar === 1 ? 0x00C851 : r.lugar === 2 ? 0x5865F2 : 0xFF8C00;

    const filePath = path.join(ASSETS, r.arquivo);
    const attach   = new AttachmentBuilder(filePath, { name: `arasaka_${i + 1}.jpeg` });

    const container = new ContainerBuilder()
      .setAccentColor(cor)
      .addTextDisplayComponents(txt(
        `### ${medal} ${r.torneio}\n` +
        `> 📅 **${dataStr}**\n` +
        `> 💀 **Kills:** ${killsStr}  ·  🎯 **Pontuação:** ${ptsStr}`
      ));

    await channel.send({
      files:      [attach],
      components: [container],
      flags:      MessageFlags.IsComponentsV2,
    });

    // Pequena pausa para não rate-limitar
    await new Promise(r => setTimeout(r, 800));
  }

  // 3. Resumo final
  const top3Kills = [...TORNEIOS]
    .filter(r => r.kills != null)
    .sort((a, b) => b.kills - a.kills)
    .slice(0, 3);

  const top3Pts = [...TORNEIOS]
    .filter(r => r.pontos != null)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 3);

  const top3KillsStr = top3Kills.map((r, i) =>
    `${medals[i]} **${r.kills} kills** — ${r.torneio}${r.data ? ` *(${r.data})*` : ''}`
  ).join('\n');

  const top3PtsStr = top3Pts.map((r, i) =>
    `${medals[i]} **${r.pontos.toLocaleString('pt-BR')} pts** — ${r.torneio}${r.data ? ` *(${r.data})*` : ''}`
  ).join('\n');

  await channel.send({
    components: [
      new ContainerBuilder()
        .setAccentColor(0xFF8C00)
        .addTextDisplayComponents(txt('### 📊 Resumo Geral · Line Arasaka'))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(txt(
          `> 🏟️ **Torneios registrados:** ${TORNEIOS.length}\n` +
          `> 🥇 **1º lugares:** ${vitorias}/${TORNEIOS.length}\n` +
          `> 💀 **Total de kills:** ${totalKills.toLocaleString('pt-BR')}\n` +
          `> 🎯 **Total de pontos:** ${totalPontos.toLocaleString('pt-BR')}\n` +
          `> 📈 **Média de kills/torneio:** ${(totalKills / TORNEIOS.filter(r => r.kills != null).length).toFixed(1)}`
        ))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(txt(`**💀 Top 3 em Kills:**\n${top3KillsStr}`))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(txt(`**🎯 Top 3 em Pontuação:**\n${top3PtsStr}`))
        .addSeparatorComponents(gap())
        .addTextDisplayComponents(txt(
          `-# ⚔️ Oblivion League · Line Arasaka · Compilado em 21/06/2026`
        )),
    ],
    flags: MessageFlags.IsComponentsV2,
  });

  console.log(`[ARASAKA] ✅ Postagem concluída — ${TORNEIOS.length} torneios.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', async () => {
  console.log(`[ARASAKA] Bot conectado como ${client.user.tag}`);

  let posted = false;
  for (const guild of client.guilds.cache.values()) {
    await guild.channels.fetch().catch(() => {});
    const ch = findChannel(guild);
    if (!ch) {
      console.warn(`[ARASAKA] Nenhum canal encontrado em "${guild.name}"`);
      continue;
    }
    await postar(ch);
    posted = true;
    break; // Posta apenas no primeiro servidor encontrado
  }

  if (!posted) {
    console.error('[ARASAKA] Nenhum canal disponível. Verifique as permissões do bot.');
  }

  client.destroy();
  process.exit(0);
});

client.login(process.env.TOKEN);
