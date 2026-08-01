const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const fs   = require('fs');
const path = require('path');

// ── Persistência ───────────────────────────────────────────────────────────────
const DATA_PATH = path.join(__dirname, '..', 'data', 'scores.json');

function loadScores() {
  try {
    if (fs.existsSync(DATA_PATH)) return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {}
  return {};
}

function saveScores(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// ── Tabela de pontos por colocação ────────────────────────────────────────────
const PLACEMENT_PTS = { 1:15, 2:13, 3:11, 4:10, 5:9, 6:8, 7:7, 8:6, 9:5, 10:4 };

function calcPoints(colocacao, kills, hab) {
  const place = PLACEMENT_PTS[colocacao] ?? 0;
  const killPts = hab ? kills * 2 : kills * 1;
  return place + killPts;
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────
function sep() {
  return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
}
function gap() {
  return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false);
}
function txt(content) {
  return new TextDisplayBuilder().setContent(content);
}

const MEDALS = ['🥇', '🥈', '🥉'];

function buildTabela(fase, teams) {
  const sorted = Object.entries(teams)
    .map(([name, d]) => ({ name, total: d.total, quedas: d.quedas.length }))
    .sort((a, b) => b.total - a.total);

  if (sorted.length === 0) {
    return new ContainerBuilder()
      .setAccentColor(0x5865F2)
      .addTextDisplayComponents(txt(`### 📊 Tabela — ${fase}\n\n-# Nenhuma queda registrada ainda.`));
  }

  const rows = sorted.map((t, i) => {
    const medal = MEDALS[i] ?? `**${i + 1}º**`;
    return `${medal}  **${t.name}** — ${t.total} pts  *(${t.quedas} quedas)*`;
  }).join('\n');

  return new ContainerBuilder()
    .setAccentColor(0xFFD700)
    .addTextDisplayComponents(txt(`### 📊 Tabela de Pontuação`))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt(`🗂️  **Fase:** ${fase}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(rows))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt(`-# ${sorted.length} equipes · atualizado agora`));
}

// ── Slash command ─────────────────────────────────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName('pontuacao')
    .setDescription('Sistema de pontuação do campeonato')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Registrar resultado de uma queda')
        .addStringOption(o => o.setName('fase').setDescription('Fase do campeonato').setRequired(true)
          .addChoices(
            { name: '1ª Classificatória', value: 'Classificatória 1' },
            { name: '2ª Classificatória', value: 'Classificatória 2' },
            { name: 'Grande Final', value: 'Grande Final' },
          ))
        .addStringOption(o => o.setName('equipe').setDescription('Nome do clã/equipe').setRequired(true))
        .addIntegerOption(o => o.setName('colocacao').setDescription('Colocação (1–20)').setRequired(true).setMinValue(1).setMaxValue(20))
        .addIntegerOption(o => o.setName('kills').setDescription('Número de kills').setRequired(true).setMinValue(0).setMaxValue(50))
        .addStringOption(o => o.setName('modo').setDescription('Com ou sem habilidades?').setRequired(true)
          .addChoices(
            { name: 'Sem habilidades', value: 'sem' },
            { name: 'Com habilidades', value: 'com' },
          ))
    )
    .addSubcommand(sub =>
      sub.setName('tabela')
        .setDescription('Ver tabela de pontuação')
        .addStringOption(o => o.setName('fase').setDescription('Fase para ver (padrão: todas)').setRequired(false)
          .addChoices(
            { name: '1ª Classificatória', value: 'Classificatória 1' },
            { name: '2ª Classificatória', value: 'Classificatória 2' },
            { name: 'Grande Final', value: 'Grande Final' },
          ))
        .addChannelOption(o =>
          o.setName('canal').setDescription('Publicar tabela neste canal (público)').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('zerar')
        .setDescription('Zerar pontuação de uma fase')
        .addStringOption(o => o.setName('fase').setDescription('Fase para zerar').setRequired(true)
          .addChoices(
            { name: '1ª Classificatória', value: 'Classificatória 1' },
            { name: '2ª Classificatória', value: 'Classificatória 2' },
            { name: 'Grande Final', value: 'Grande Final' },
            { name: '⚠️ TUDO', value: 'ALL' },
          ))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── ADD ──────────────────────────────────────────────────────────────────
    if (sub === 'add') {
      const fase      = interaction.options.getString('fase');
      const equipe    = interaction.options.getString('equipe').trim();
      const colocacao = interaction.options.getInteger('colocacao');
      const kills     = interaction.options.getInteger('kills');
      const modo      = interaction.options.getString('modo');
      const hab       = modo === 'com';

      const pts = calcPoints(colocacao, kills, hab);
      const scores = loadScores();
      if (!scores[fase]) scores[fase] = {};
      if (!scores[fase][equipe]) scores[fase][equipe] = { total: 0, quedas: [] };

      scores[fase][equipe].total += pts;
      scores[fase][equipe].quedas.push({ colocacao, kills, hab, pts });
      saveScores(scores);

      const placeStr = PLACEMENT_PTS[colocacao] != null
        ? `${PLACEMENT_PTS[colocacao]} pts`
        : `0 pts`;
      const killStr = hab ? `${kills} × 2 = ${kills * 2} pts` : `${kills} × 1 = ${kills} pts`;

      await interaction.reply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0x00C851)
            .addTextDisplayComponents(txt(
              `### ✅ Queda Registrada\n` +
              `**Equipe:** ${equipe}  ·  **Fase:** ${fase}\n` +
              `**Colocação:** ${colocacao}º → ${placeStr}\n` +
              `**Kills:** ${killStr}\n` +
              `**Total desta queda:** **+${pts} pts**`
            ))
            .addSeparatorComponents(gap())
            .addTextDisplayComponents(txt(
              `📊 **Total acumulado:** ${scores[fase][equipe].total} pts  ` +
              `*(${scores[fase][equipe].quedas.length} quedas)*`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });
      return;
    }

    // ── TABELA ───────────────────────────────────────────────────────────────
    if (sub === 'tabela') {
      const fase   = interaction.options.getString('fase');
      const canal  = interaction.options.getChannel('canal');
      const scores = loadScores();

      // Monta os containers corretos
      let containers;
      if (!fase) {
        const fases = ['Classificatória 1', 'Classificatória 2', 'Grande Final'];
        containers = fases
          .filter(f => scores[f] && Object.keys(scores[f]).length > 0)
          .map(f => buildTabela(f, scores[f]));

        if (containers.length === 0) {
          containers = [
            new ContainerBuilder()
              .setAccentColor(0x5865F2)
              .addTextDisplayComponents(txt('### 📊 Pontuação\n\n-# Nenhuma queda registrada ainda.')),
          ];
        }
      } else {
        containers = [buildTabela(fase, scores[fase] ?? {})];
      }

      // ── Publica em canal externo ─────────────────────────────────────────
      if (canal) {
        await canal.send({
          components: containers,
          flags: MessageFlags.IsComponentsV2,
        });
        await interaction.reply({
          components: [
            new ContainerBuilder()
              .setAccentColor(0x00C851)
              .addTextDisplayComponents(txt(
                `### ✅ Tabela publicada\nRanking postado em <#${canal.id}>.`
              )),
          ],
          flags: MessageFlags.IsComponentsV2,
          ephemeral: true,
        });
        return;
      }

      // ── Resposta normal (visível no canal atual) ─────────────────────────
      await interaction.reply({
        components: containers,
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    // ── ZERAR ────────────────────────────────────────────────────────────────
    if (sub === 'zerar') {
      const fase = interaction.options.getString('fase');
      const scores = loadScores();

      if (fase === 'ALL') {
        Object.keys(scores).forEach(k => delete scores[k]);
        saveScores(scores);
        await interaction.reply({
          components: [
            new ContainerBuilder()
              .setAccentColor(0xFF4444)
              .addTextDisplayComponents(txt('### 🗑️ Pontuação Zerada\nTodas as fases foram resetadas.')),
          ],
          flags: MessageFlags.IsComponentsV2,
          ephemeral: true,
        });
        return;
      }

      delete scores[fase];
      saveScores(scores);
      await interaction.reply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFF4444)
            .addTextDisplayComponents(txt(`### 🗑️ Fase Zerada\nPontuação de **${fase}** foi resetada.`)),
        ],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });
    }
  },
};
