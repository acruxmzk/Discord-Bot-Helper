/**
 * postArasaka.js — Posta galeria + resumo da Line Arasaka num canal específico.
 * Executar: node artifacts/discord-bot/scripts/postArasaka.js
 */

const {
  Client,
  GatewayIntentBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  AttachmentBuilder,
} = require('discord.js');
const path = require('path');

const ASSETS      = path.join(__dirname, '..', '..', '..', 'attached_assets');
const INVITE_CODE = 'EcQ4bqWK7';

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = (c) => new TextDisplayBuilder().setContent(c);

// ─── Dados dos torneios (por data) ───────────────────────────────────────────
const TORNEIOS = [
  { data: '26/05/2026', torneio: 'Andromeda Torneio · Fase 3',          lugar: 1, kills: 139, pontos: 169,  arquivo: '78f078e0-8620-4750-81f6-2d777778e186_1781585683756.jpeg'  },
  { data: '31/05/2026', torneio: 'Xtreino Deuses do Egito',             lugar: 1, kills: 134, pontos: 770,  arquivo: 'e733ee48-3af0-4873-9233-a5eee22901aa_1781585683756.jpeg'  },
  { data: '02/06/2026', torneio: 'X-Treino Shark · Modo Squad',         lugar: 1, kills: 144, pontos: 1550, arquivo: 'd839d28f-98f6-413c-a4c5-f188ab30049f_1781585683756.jpeg'  },
  { data: '05/06/2026', torneio: 'Xtreino Invictus · Modo Squad',       lugar: 1, kills: 150, pontos: 1510, arquivo: 'edca3869-3696-42ce-ac63-b533b3e8bfb9_1781585683756.jpeg'  },
  { data: '08/06/2026', torneio: 'Arena Premiada · Divine in Pact',     lugar: 1, kills: 153, pontos: 1710, arquivo: '18bd1589-6c81-40e2-abdc-9c809b87cad1_1781585683756.jpeg'  },
  { data: '09/06/2026', torneio: 'X-Treino Shark · Modo Squad',         lugar: 1, kills: 155, pontos: 1730, arquivo: '6cddcf6f-ffcf-439c-a6a3-dbe2966c1996_1781585683756.jpeg'  },
  { data: '15/06/2026', torneio: 'Arena Premiada · Divine in Pact',     lugar: 1, kills: 127, pontos: 1500, arquivo: 'fdab26de-8c32-4a13-b9b2-7a45f84f49fc_1781585683756.jpeg'  },
  { data: '17/06/2026', torneio: 'XT-Kingslayers Eclipse',              lugar: 1, kills: 106, pontos: 1155, arquivo: '31dc6a60-860d-4132-8d23-1d1d1b82391c_1782185227958.jpeg'  },
  { data: '20/06/2026', torneio: 'Torneio Baixada 13',                  lugar: 1, kills: 106, pontos: 1290, arquivo: '22976ce5-e5f1-4c50-8e8a-fb775e4bb2cc_1782185227958.jpeg'  },
  { data: '20/06/2026', torneio: 'X-Treino Gueto',                      lugar: 1, kills: 156, pontos: 1660, arquivo: '5101959D-C630-4BE1-B126-A0C24CE0BEA3_1782185227958.jpeg'  },
  { data: null,         torneio: 'Torneio Baixada 13 · 2ª Etapa',       lugar: 1, kills: 150, pontos: 1770, arquivo: 'IMG_5590_1781585683756.jpeg'                               },
  { data: null,         torneio: 'Torneio Tribruxo',                     lugar: 1, kills: 136, pontos: 1470, arquivo: 'a1469000-ba14-488a-a4a1-d59ade8ba744_1781585683756.jpeg'  },
  { data: null,         torneio: 'X-Treino Frontier · Quinta 22h (A)',   lugar: 2, kills: 110, pontos: 1135, arquivo: '14f6d047-608f-414c-a089-e0b73a0487ea_1781585683756.jpeg'  },
  { data: null,         torneio: 'X-Treino da Resistência (A)',          lugar: 1, kills: null,pontos: 980,  arquivo: '63f41bbf-c9c2-4600-a8e7-b1fcea71960e_1781585683756.jpeg'  },
  { data: null,         torneio: 'Xtreino Colíseu',                      lugar: 1, kills: 164, pontos: 2550, arquivo: '715fa996-c660-43f4-b55b-d9e6815ce4f1_1782185227957.jpeg'  },
  { data: null,         torneio: 'X-Treino Frontier · Quinta 22h (B)',   lugar: 1, kills: 130, pontos: 1395, arquivo: '0230bff9-91b1-49c1-a353-39ee353dcd9f_1782185227958.jpeg'  },
  { data: null,         torneio: 'X-Treino da Resistência (B)',          lugar: 1, kills: null,pontos: 825,  arquivo: '5a55538e-fb0b-4805-a576-b83be3285c2a_1782185227958.jpeg'  },
  { data: null,         torneio: 'X-Treino Resistência Winners · Queda 2',lugar:1, kills: 60,  pontos: null, arquivo: 'ed716ce3-c274-4c3d-9ff4-301d4284236f_1782185227958.jpeg'  },
  { data: null,         torneio: 'Torneio Tribruxo Winners · Queda 1',   lugar: 1, kills: 61,  pontos: null, arquivo: 'd32f4be1-edcb-4fbd-8bb6-460f34eafbcb_1782185227958.jpeg'  },
  { data: null,         torneio: 'Torneio Tribruxo Winners · Queda 2',   lugar: 1, kills: 49,  pontos: null, arquivo: '8e61f5c1-b56b-482a-9ced-fec060bbddcd_1782185227958.jpeg'  },
];

const totalKills  = TORNEIOS.reduce((s, r) => s + (r.kills  ?? 0), 0);
const totalPontos = TORNEIOS.reduce((s, r) => s + (r.pontos ?? 0), 0);
const vitorias    = TORNEIOS.filter(r => r.lugar === 1).length;
const medals      = ['🥇', '🥈', '🥉'];

// ─── Construir mensagens com MediaGallery (max 10 itens por galeria) ──────────
function buildGalleryMessages() {
  const msgs = [];
  const BATCH = 10;

  for (let i = 0; i < TORNEIOS.length; i += BATCH) {
    const grupo = TORNEIOS.slice(i, i + BATCH);

    const files = grupo.map((r, j) =>
      new AttachmentBuilder(path.join(ASSETS, r.arquivo), {
        name: `arasaka_${i + j + 1}.jpeg`,
      })
    );

    const gallery = new MediaGalleryBuilder();
    grupo.forEach((_, j) => {
      gallery.addItems(
        new MediaGalleryItemBuilder().setURL(`attachment://arasaka_${i + j + 1}.jpeg`)
      );
    });

    const parte   = Math.floor(i / BATCH) + 1;
    const total   = Math.ceil(TORNEIOS.length / BATCH);
    const container = new ContainerBuilder()
      .setAccentColor(0xFFD700)
      .addMediaGalleryComponents(gallery)
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false))
      .addTextDisplayComponents(
        txt(`-# ⚔️ Oblivion · Line Arasaka · Tabelas ${i + 1}–${Math.min(i + BATCH, TORNEIOS.length)} de ${TORNEIOS.length} · Parte ${parte}/${total}`)
      );

    msgs.push({ files, container });
  }

  return msgs;
}

// ─── Container de resumo geral ────────────────────────────────────────────────
function buildResumo() {
  const comKills = TORNEIOS.filter(r => r.kills != null);
  const top3K    = [...comKills].sort((a, b) => b.kills - a.kills).slice(0, 3);
  const top3P    = TORNEIOS.filter(r => r.pontos != null).sort((a, b) => b.pontos - a.pontos).slice(0, 3);

  const top3KStr = top3K.map((r, i) =>
    `${medals[i]} **${r.kills} kills** — ${r.torneio}${r.data ? ` *(${r.data})*` : ''}`
  ).join('\n');

  const top3PStr = top3P.map((r, i) =>
    `${medals[i]} **${r.pontos.toLocaleString('pt-BR')} pts** — ${r.torneio}${r.data ? ` *(${r.data})*` : ''}`
  ).join('\n');

  return new ContainerBuilder()
    .setAccentColor(0xFF8C00)
    .addTextDisplayComponents(txt('## ⚔️ OBLIVION · LINE ARASAKA\n### 📊 Resumo Geral de Resultados'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(
      `> 🏟️ **Torneios:**  ${TORNEIOS.length}\n` +
      `> 🥇 **1º lugares:**  ${vitorias}/${TORNEIOS.length}\n` +
      `> 💀 **Total de kills:**  ${totalKills.toLocaleString('pt-BR')}\n` +
      `> 🎯 **Total de pontos:**  ${totalPontos.toLocaleString('pt-BR')}\n` +
      `> 📈 **Média kills/torneio:**  ${(totalKills / comKills.length).toFixed(1)}`
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(`**💀 Top 3 Kills:**\n${top3KStr}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(`**🎯 Top 3 Pontuação:**\n${top3PStr}`))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt(`-# ⚔️ Oblivion League · Line Arasaka · 21/06/2026`));
}

// ─── Postar no canal ──────────────────────────────────────────────────────────
async function postar(channel) {
  console.log(`[ARASAKA] Postando em #${channel.name} · ${channel.guild.name}`);

  // Título
  await channel.send({
    components: [
      new ContainerBuilder()
        .setAccentColor(0xFFD700)
        .addTextDisplayComponents(txt(
          `## ⚔️ OBLIVION · LINE ARASAKA\n` +
          `### 🏆 Histórico de Resultados — X-Treinos & Torneios\n` +
          `-# ${TORNEIOS.length} torneios registrados · Organizado por data · 21/06/2026`
        )),
    ],
    flags: MessageFlags.IsComponentsV2,
  });
  await new Promise(r => setTimeout(r, 800));

  const msgs = buildGalleryMessages();

  for (const { files, container } of msgs) {
    await channel.send({
      files,
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
    await new Promise(r => setTimeout(r, 1200));
  }

  await channel.send({
    components: [buildResumo()],
    flags: MessageFlags.IsComponentsV2,
  });

  console.log(`[ARASAKA] ✅ Concluído — ${TORNEIOS.length} tabelas + resumo.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`[ARASAKA] Logado como ${client.user.tag}`);
  console.log(`[ARASAKA] Servidores no cache: ${[...client.guilds.cache.values()].map(g => g.name).join(', ')}`);

  let targetChannel = null;

  // Canal resolvido via invite EcQ4bqWK7 → #📊・tabela-arasaka
  const TARGET_CHANNEL_ID = '1514696441317032159';

  try {
    targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);
  } catch (err) {
    console.warn(`[ARASAKA] Erro ao buscar canal: ${err.message}`);
  }

  if (!targetChannel) {
    console.error('[ARASAKA] ❌ Canal não encontrado. Verifique se o bot tem acesso ao canal.');
    client.destroy();
    process.exit(1);
  }

  console.log(`[ARASAKA] ✅ Canal encontrado: #${targetChannel.name} em "${targetChannel.guild?.name}"`);
  await postar(targetChannel);
  client.destroy();
  process.exit(0);
});

client.login(process.env.TOKEN);
