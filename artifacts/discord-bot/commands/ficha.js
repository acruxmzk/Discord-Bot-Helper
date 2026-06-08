const {
  SlashCommandBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
} = require('discord.js');
const fichaDB = require('../utils/fichaDB');

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = (s) => new TextDisplayBuilder().setContent(s);

const STATUS_EMOJI = { PENDENTE: '⏳', APROVADA: '✅', REJEITADA: '❌' };

function fichaToText(row) {
  const jogadores = (row.jogadores ?? []).map((p, i) => {
    const tipo = i < 3 ? 'Titular' : 'Reserva';
    return `**P${i + 1} · ${tipo}**\n> \`Nick  \` ${p.nome}\n> \`UID   \` ${p.uid}\n> \`TikTok\` ${p.tiktok}`;
  }).join('\n\n');

  const status = row.status ?? 'PENDENTE';
  const emoji  = STATUS_EMOJI[status] ?? '❓';

  return { jogadores, status, emoji };
}

function buildFichaContainer(row) {
  const { jogadores, status, emoji } = fichaToText(row);
  const ts = Math.floor(new Date(row.criado_em).getTime() / 1000);

  return [
    new ContainerBuilder()
      .setAccentColor(status === 'APROVADA' ? 0x00C851 : status === 'REJEITADA' ? 0xFF4444 : 0xFFA500)
      .addTextDisplayComponents(txt(
        `## 🏆 OBLIVION LEAGUE\n### 📋 Ficha de Inscrição\n\n` +
        `> 🆔 **ID:** \`${row.registro_id}\`\n` +
        `> 📅 **Recebido em:** <t:${ts}:F>\n` +
        `> ${emoji} **Status:** \`${status}\``
      )),
    new ContainerBuilder()
      .setAccentColor(0x5865F2)
      .addTextDisplayComponents(txt(
        `### 🛡️ Dados do Clã\n\n` +
        `> 🏷️ **Clã** · ${row.cla}\n` +
        `> 🔖 **TAG** · \`${row.tag}\`\n` +
        `> ⚔️ **Line** · ${row.line ?? '—'}\n` +
        `> 👤 **Manager** · ${row.manager ?? '—'}\n` +
        `> 🎵 **TikTok** · ${row.tiktok ?? '—'}`
      )),
    new ContainerBuilder()
      .setAccentColor(0x00C851)
      .addTextDisplayComponents(txt(`### 👥 Lineup · ${(row.jogadores ?? []).length} jogador(es)`))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(jogadores || '—'))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(
        row.observacoes ? `📝 **Obs:** ${row.observacoes}\n` : '' +
        `-# 🤖 ${row.registro_id} · Oblivion League`
      )),
  ];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ficha')
    .setDescription('Gerencia as fichas de inscrição da Oblivion League')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub.setName('buscar')
        .setDescription('Busca uma ficha por ID de registro ou nome do clã')
        .addStringOption(o =>
          o.setName('query').setDescription('ID (OBL-...) ou nome/TAG do clã').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('listar')
        .setDescription('Lista as fichas de inscrição')
        .addStringOption(o =>
          o.setName('status')
            .setDescription('Filtrar por status')
            .addChoices(
              { name: '⏳ Pendentes', value: 'PENDENTE' },
              { name: '✅ Aprovadas', value: 'APROVADA' },
              { name: '❌ Rejeitadas', value: 'REJEITADA' },
              { name: 'Todas', value: 'TODAS' },
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('editar')
        .setDescription('Edita os dados de uma ficha aprovada')
        .addStringOption(o =>
          o.setName('id').setDescription('ID de registro (OBL-...)').setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── /ficha buscar ──────────────────────────────────────────────────────────
    if (sub === 'buscar') {
      await interaction.deferReply({ ephemeral: true });
      const query = interaction.options.getString('query');
      const rows  = await fichaDB.buscar(query);

      if (!rows.length) {
        return interaction.editReply({
          components: [
            new ContainerBuilder()
              .setAccentColor(0xFF6B35)
              .addTextDisplayComponents(txt(
                `### ❓ Nenhuma ficha encontrada\n-# Busca: "${query}"`
              )),
          ],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const row = rows[0];
      const containers = buildFichaContainer(row);

      if (rows.length > 1) {
        containers.push(
          new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(txt(
              `-# ${rows.length} resultado(s) encontrado(s). Mostrando o mais recente.`
            ))
        );
      }

      return interaction.editReply({
        components: containers,
        flags: MessageFlags.IsComponentsV2,
      });
    }

    // ── /ficha listar ──────────────────────────────────────────────────────────
    if (sub === 'listar') {
      await interaction.deferReply({ ephemeral: true });
      const statusOpt = interaction.options.getString('status') ?? 'TODAS';
      const rows = await fichaDB.listar(statusOpt === 'TODAS' ? null : statusOpt, 15);

      if (!rows.length) {
        return interaction.editReply({
          components: [
            new ContainerBuilder()
              .setAccentColor(0xFF6B35)
              .addTextDisplayComponents(txt('### 📋 Nenhuma ficha encontrada para esse filtro.')),
          ],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const linhas = rows.map((r, i) => {
        const emoji = STATUS_EMOJI[r.status] ?? '❓';
        const ts    = Math.floor(new Date(r.criado_em).getTime() / 1000);
        return `${emoji} \`${r.registro_id}\` · **${r.cla}** (\`${r.tag}\`) · <t:${ts}:d>`;
      }).join('\n');

      return interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFFA500)
            .addTextDisplayComponents(txt(`### 📋 Fichas — ${statusOpt}`))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(linhas))
            .addSeparatorComponents(gap())
            .addTextDisplayComponents(txt(`-# ${rows.length} resultado(s) · Use /ficha buscar [ID] para detalhes`)),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    // ── /ficha editar ──────────────────────────────────────────────────────────
    if (sub === 'editar') {
      const id  = interaction.options.getString('id');
      const row = await fichaDB.getById(id);

      if (!row) {
        return interaction.reply({
          components: [
            new ContainerBuilder()
              .setAccentColor(0xFF4444)
              .addTextDisplayComponents(txt(`### ❌ Ficha \`${id}\` não encontrada.`)),
          ],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      const jogadores = row.jogadores ?? [];
      const p1 = jogadores[0] ? `${jogadores[0].nome} | ${jogadores[0].uid} | ${jogadores[0].tiktok}` : '';
      const p23 = jogadores.slice(1, 3).map(p => `${p.nome} | ${p.uid} | ${p.tiktok}`).join('\n');
      const p45 = jogadores.slice(3, 5).map(p => `${p.nome} | ${p.uid} | ${p.tiktok}`).join('\n');

      const modal = new ModalBuilder()
        .setCustomId(`ficha_editar_submit:${id}`)
        .setTitle(`Editar Ficha · ${id}`)
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('cla_tag')
              .setLabel('Clã e TAG')
              .setStyle(TextInputStyle.Short)
              .setValue(`${row.cla} | ${row.tag}`)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('line_manager')
              .setLabel('Line · Manager · TikTok do Clã')
              .setStyle(TextInputStyle.Short)
              .setValue(`${row.line ?? ''} | ${row.manager ?? ''} | ${row.tiktok ?? ''}`)
              .setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('p1')
              .setLabel('Jogador 1 — Titular (Nick | UID | @TikTok)')
              .setStyle(TextInputStyle.Short)
              .setValue(p1)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('p2_p3')
              .setLabel('Jogadores 2 e 3 — Titulares')
              .setStyle(TextInputStyle.Paragraph)
              .setValue(p23)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('observacoes')
              .setLabel('Observações (opcional)')
              .setStyle(TextInputStyle.Paragraph)
              .setValue(row.observacoes ?? '')
              .setRequired(false)
          ),
        );

      return interaction.showModal(modal);
    }
  },
};
