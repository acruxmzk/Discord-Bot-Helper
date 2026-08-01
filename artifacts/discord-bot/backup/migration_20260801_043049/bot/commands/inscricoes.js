const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
  ComponentType,
} = require('discord.js');
const tallyDB = require('../utils/tallyDB');

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = (c) => new TextDisplayBuilder().setContent(c);

const STATUS_COLOR = {
  PENDENTE:  0xFFA500,
  REJEITADA: 0xFF4444,
  APROVADA:  0x57F287,
};

const STATUS_EMOJI = {
  PENDENTE:  '⏳',
  REJEITADA: '❌',
  APROVADA:  '✅',
};

function buildPage(data, filtro) {
  const { rows, total, pagina, totalPaginas, status } = data;

  const tituloFiltro = filtro === 'TODAS' ? 'Todas' : filtro;
  const cor = filtro === 'REJEITADA' ? 0xFF4444
            : filtro === 'APROVADA'  ? 0x57F287
            : filtro === 'PENDENTE'  ? 0xFFA500
            : 0x5865F2;

  const linhas = rows.map((r, i) => {
    const n       = (pagina - 1) * 5 + i + 1;
    const dt      = r.received_at ? new Date(r.received_at).toLocaleDateString('pt-BR') : '—';
    const emoji   = STATUS_EMOJI[r.status] ?? '❓';
    const uids    = Array.isArray(r.uids) ? r.uids : (r.uids ?? []);
    const uidStr  = uids.length > 0 ? uids.map(u => `\`${u}\``).join(' · ') : '_(nenhum)_';
    const squad   = r.squad_name ? `**${r.squad_name}**` : '_(sem nome)_';
    const tag     = r.squad_tag  ? ` \`[${r.squad_tag}]\`` : '';
    const manager = r.manager_name ?? '—';

    return (
      `**${n}.** ${emoji} ${squad}${tag}  ·  ${dt}\n` +
      `> 👤 Manager: ${manager}\n` +
      `> 🆔 UIDs: ${uidStr}\n` +
      `-# ID: \`${r.submission_id}\``
    );
  }).join('\n\n');

  const container = new ContainerBuilder()
    .setAccentColor(cor)
    .addTextDisplayComponents(txt(
      `### 📋 Inscrições Tally · ${tituloFiltro} — ${total} registro(s)`
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(linhas || '_(nenhuma inscrição encontrada)_'))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt(
      `-# Página ${pagina} de ${totalPaginas}  ·  use o filtro de status para refinar`
    ));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('insc_prev')
      .setLabel('◀ Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pagina <= 1),
    new ButtonBuilder()
      .setCustomId('insc_next')
      .setLabel('Próximo ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pagina >= totalPaginas),
  );

  return { container, row };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inscricoes')
    .setDescription('Ver inscrições do Tally (staff)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName('status')
        .setDescription('Filtrar por status')
        .setRequired(false)
        .addChoices(
          { name: '📋 Todas',     value: 'TODAS'     },
          { name: '⏳ Pendente',  value: 'PENDENTE'  },
          { name: '❌ Rejeitada', value: 'REJEITADA' },
          { name: '✅ Aprovada',  value: 'APROVADA'  },
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const filtro = interaction.options.getString('status') ?? 'TODAS';
    const statusQuery = filtro === 'TODAS' ? null : filtro;

    let pagina = 1;

    const data = await tallyDB.listar({ status: statusQuery, pagina, porPagina: 5 });

    if (data.total === 0) {
      const label = filtro === 'TODAS' ? 'nenhuma inscrição registrada' : `nenhuma inscrição com status **${filtro}**`;
      await interaction.editReply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(txt(`### 📋 Inscrições Tally\n\n-# 📭 ${label}.`)),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    const { container, row } = buildPage({ ...data, status: statusQuery }, filtro);
    const components = data.totalPaginas > 1 ? [container, row] : [container];

    const reply = await interaction.editReply({
      components,
      flags: MessageFlags.IsComponentsV2,
    });

    if (data.totalPaginas <= 1) return;

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: i => i.user.id === interaction.user.id && ['insc_prev', 'insc_next'].includes(i.customId),
      time: 180_000,
    });

    collector.on('collect', async btn => {
      if (btn.customId === 'insc_next') pagina = Math.min(pagina + 1, data.totalPaginas);
      else pagina = Math.max(pagina - 1, 1);

      const fresh = await tallyDB.listar({ status: statusQuery, pagina, porPagina: 5 });
      const { container: c, row: r } = buildPage({ ...fresh, status: statusQuery }, filtro);
      const newComponents = fresh.totalPaginas > 1 ? [c, r] : [c];
      await btn.update({ components: newComponents, flags: MessageFlags.IsComponentsV2 });
    });

    collector.on('end', async () => {
      const fresh = await tallyDB.listar({ status: statusQuery, pagina, porPagina: 5 });
      const { container: c } = buildPage({ ...fresh, status: statusQuery }, filtro);
      await interaction.editReply({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  },
};
