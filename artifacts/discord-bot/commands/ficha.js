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
} = require('discord.js');
const fichaDB = require('../utils/fichaDB');

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = (s) => new TextDisplayBuilder().setContent(s);

const STATUS_EMOJI = { PENDENTE: '⏳', APROVADA: '✅', REJEITADA: '❌' };

function buildFichaContainer(row) {
  const status = row.status ?? 'PENDENTE';
  const emoji  = STATUS_EMOJI[status] ?? '❓';
  const color  = status === 'APROVADA' ? 0x00C851 : status === 'REJEITADA' ? 0xFF4444 : 0xFFA500;
  const ts     = Math.floor(new Date(row.criado_em).getTime() / 1000);

  const jogadores = (row.jogadores ?? []);
  const playerBlock = jogadores.map((p, i) => {
    const tipo = i < 3 ? 'Titular' : 'Reserva';
    return `**P${i + 1} · ${tipo}**\n> \`Nick  \` ${p.nome}\n> \`UID   \` ${p.uid}\n> \`TikTok\` ${p.tiktok}`;
  }).join('\n\n');

  const footerLines = [];
  if (row.observacoes) footerLines.push(`📝 **Obs:** ${row.observacoes}`);
  footerLines.push(`-# 🤖 ${row.registro_id} · Oblivion League`);

  return [
    new ContainerBuilder()
      .setAccentColor(color)
      .addTextDisplayComponents(txt(
        `## 🏆 OBLIVION LEAGUE\n### 📋 Ficha de Inscrição\n\n` +
        `> 🆔 **ID:** \`${row.registro_id}\`\n` +
        `> 📅 **Recebido em:** <t:${ts}:F>\n` +
        `> 👤 **Solicitante:** <@${row.solicitante_id}>\n` +
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
      .addTextDisplayComponents(txt(`### 👥 Lineup · ${jogadores.length} jogador(es)`))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(playerBlock || '—'))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(footerLines.join('\n'))),
  ];
}

// ── Sugestões de autocomplete ─────────────────────────────────────────────────
async function getAutocompleteSuggestions(focusedValue, statusFilter = null) {
  try {
    const rows = focusedValue.trim()
      ? await fichaDB.buscar(focusedValue)
      : await fichaDB.listar(statusFilter, 25);

    return rows.slice(0, 25).map(r => {
      const emoji = STATUS_EMOJI[r.status] ?? '❓';
      const label = `${emoji} ${r.cla} (${r.tag}) · ${r.registro_id}`;
      return {
        name:  label.length > 100 ? label.slice(0, 97) + '…' : label,
        value: r.registro_id,
      };
    });
  } catch {
    return [];
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ficha')
    .setDescription('Gerencia as fichas de inscrição da Oblivion League')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub.setName('buscar')
        .setDescription('Busca uma ficha pelo nome do clã ou ID de registro')
        .addStringOption(o =>
          o.setName('query')
            .setDescription('Digite o nome do clã, TAG ou ID (OBL-...)')
            .setRequired(true)
            .setAutocomplete(true)
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
        .setDescription('Edita os dados de uma ficha')
        .addStringOption(o =>
          o.setName('id')
            .setDescription('Nome do clã ou ID de registro')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('repostar')
        .setDescription('Posta uma ficha aprovada no canal #fichas-aprovadas')
        .addStringOption(o =>
          o.setName('id')
            .setDescription('Nome do clã ou ID de registro')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  // ── Autocomplete ────────────────────────────────────────────────────────────
  async autocomplete(interaction) {
    const sub          = interaction.options.getSubcommand();
    const focusedValue = interaction.options.getFocused();

    let choices;
    if (sub === 'editar') {
      choices = await getAutocompleteSuggestions(focusedValue);
    } else if (sub === 'repostar') {
      choices = await getAutocompleteSuggestions(focusedValue, 'APROVADA');
    } else {
      choices = await getAutocompleteSuggestions(focusedValue);
    }

    await interaction.respond(choices);
  },

  // ── Execute ─────────────────────────────────────────────────────────────────
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── /ficha buscar ──────────────────────────────────────────────────────────
    if (sub === 'buscar') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const query = interaction.options.getString('query');

      // Autocomplete já fornece o registroId exato — tenta busca direta primeiro
      let row = await fichaDB.getById(query);
      let rows;
      if (!row) {
        rows = await fichaDB.buscar(query);
        row  = rows[0] ?? null;
      }

      if (!row) {
        return interaction.editReply({
          components: [
            new ContainerBuilder()
              .setAccentColor(0xFF6B35)
              .addTextDisplayComponents(txt(`### ❓ Nenhuma ficha encontrada\n-# Busca: "${query}"`)),
          ],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const containers = buildFichaContainer(row);
      if (rows?.length > 1) {
        containers.push(
          new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(txt(
              `-# ${rows.length} resultado(s). Mostrando o mais recente. Use /ficha listar para ver todos.`
            ))
        );
      }

      return interaction.editReply({ components: containers, flags: MessageFlags.IsComponentsV2 });
    }

    // ── /ficha listar ──────────────────────────────────────────────────────────
    if (sub === 'listar') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const statusOpt = interaction.options.getString('status') ?? 'TODAS';
      const rows      = await fichaDB.listar(statusOpt === 'TODAS' ? null : statusOpt, 20);

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

      const linhas = rows.map(r => {
        const emoji = STATUS_EMOJI[r.status] ?? '❓';
        const ts    = Math.floor(new Date(r.criado_em).getTime() / 1000);
        return `${emoji} **${r.cla}** (\`${r.tag}\`) · \`${r.registro_id}\` · <t:${ts}:d>`;
      }).join('\n');

      return interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFFA500)
            .addTextDisplayComponents(txt(`### 📋 Fichas — ${statusOpt}`))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(linhas))
            .addSeparatorComponents(gap())
            .addTextDisplayComponents(txt(
              `-# ${rows.length} ficha(s) · Use /ficha buscar e escolha pelo nome do clã para ver detalhes`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    // ── /ficha editar ──────────────────────────────────────────────────────────
    if (sub === 'editar') {
      const id  = interaction.options.getString('id');
      const row = await fichaDB.getById(id) ?? (await fichaDB.buscar(id))[0] ?? null;

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
      const p1  = jogadores[0] ? `${jogadores[0].nome} | ${jogadores[0].uid} | ${jogadores[0].tiktok}` : '';
      const p23 = jogadores.slice(1, 3).map(p => `${p.nome} | ${p.uid} | ${p.tiktok}`).join('\n');

      const modal = new ModalBuilder()
        .setCustomId(`ficha_editar_submit:${row.registro_id}`)
        .setTitle(`Editar · ${row.registro_id}`)
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

    // ── /ficha repostar ────────────────────────────────────────────────────────
    if (sub === 'repostar') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const id  = interaction.options.getString('id');
      const row = await fichaDB.getById(id) ?? (await fichaDB.buscar(id))[0] ?? null;

      if (!row) {
        return interaction.editReply({
          components: [
            new ContainerBuilder()
              .setAccentColor(0xFF4444)
              .addTextDisplayComponents(txt(`### ❌ Ficha \`${id}\` não encontrada.`)),
          ],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      if (row.status !== 'APROVADA') {
        return interaction.editReply({
          components: [
            new ContainerBuilder()
              .setAccentColor(0xFF6B35)
              .addTextDisplayComponents(txt(
                `### ⚠️ Ficha não aprovada\n` +
                `A ficha \`${row.registro_id}\` está com status **${row.status}**.\n` +
                `-# Só fichas APROVADAS podem ser repostadas.`
              )),
          ],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      // Reutiliza o handler para encontrar ou criar o canal automaticamente
      const { buildFichaContainers, findOrCreateFichasChannel } = require('../handlers/fichaHandler');

      const fichasCh = await findOrCreateFichasChannel(interaction.guild);

      if (!fichasCh) {
        return interaction.editReply({
          components: [
            new ContainerBuilder()
              .setAccentColor(0xFF4444)
              .addTextDisplayComponents(txt(
                `### ❌ Sem permissão\nNão consegui criar o canal \`#fichas-aprovadas\`.\n` +
                `-# Verifique se o bot tem permissão para gerenciar canais.`
              )),
          ],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const msg = await fichasCh.send({
        components: buildFichaContainers(row, { status: 'APROVADA' }),
        flags: MessageFlags.IsComponentsV2,
      });

      await fichaDB.atualizar(row.registro_id, {
        fichas_msg_id: msg.id,
        fichas_ch_id:  fichasCh.id,
      });

      return interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0x00C851)
            .addTextDisplayComponents(txt(
              `### ✅ Ficha repostada!\n` +
              `**${row.cla}** (\`${row.registro_id}\`) foi publicada em <#${fichasCh.id}>.`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
