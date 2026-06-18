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
const { listBans, searchBans } = require('../utils/banDB');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function gap() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

const PAGE_SIZE = 8;

function buildPage(rows, page, busca) {
  const total    = rows.length;
  const totalPgs = Math.ceil(total / PAGE_SIZE);
  const slice    = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const linhas = slice.map((r, i) => {
    const n    = page * PAGE_SIZE + i + 1;
    const data = new Date(r.banned_at).toLocaleDateString('pt-BR');
    const nick = r.nick ? r.nick : '—';
    return (
      `**${String(n).padStart(2, '0')}.** \`${r.uid}\`  **·**  ${nick}\n` +
      `> ${r.reason}  ·  *${data}*`
    );
  }).join('\n\n');

  const titulo = busca
    ? `### 🔍 Busca: \`${busca}\` — ${total} resultado(s)`
    : `### 🚫 Jogadores Banidos — ${total} registro(s)`;

  const rodape = totalPgs > 1
    ? `-# Página ${page + 1} de ${totalPgs}  ·  busca por UID ou nick com \`/bans busca:\``
    : `-# busca por UID ou nick com \`/bans busca:\``;

  const container = new ContainerBuilder()
    .setAccentColor(0xFF4444)
    .addTextDisplayComponents(txt(titulo))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(linhas))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(txt(rodape));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('bans_prev')
      .setLabel('◀ Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId('bans_next')
      .setLabel('Próximo ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPgs - 1),
  );

  return { container, row, totalPgs };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bans')
    .setDescription('Listar jogadores banidos da Oblivion League')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName('busca')
        .setDescription('Filtrar por UID ou nick (parcial)')
        .setRequired(false)
        .setMaxLength(40)
    ),

  async execute(interaction) {
    const busca = interaction.options.getString('busca');
    const rows  = busca ? await searchBans(busca) : await listBans(200);

    if (rows.length === 0) {
      const msg = busca
        ? `Nenhum resultado para \`${busca}\`.`
        : 'Nenhum jogador banido registrado.';
      await interaction.reply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(txt(`### 📋 Jogadores Banidos\n\n-# ${msg}`)),
        ],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });
      return;
    }

    let page = 0;
    const { container, row, totalPgs } = buildPage(rows, page, busca);

    const components = totalPgs > 1 ? [container, row] : [container];

    const reply = await interaction.reply({
      components,
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true,
    });

    if (totalPgs <= 1) return;

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: i => i.user.id === interaction.user.id && ['bans_prev', 'bans_next'].includes(i.customId),
      time: 120_000,
    });

    collector.on('collect', async btn => {
      if (btn.customId === 'bans_next') page = Math.min(page + 1, totalPgs - 1);
      else page = Math.max(page - 1, 0);

      const { container: c, row: r } = buildPage(rows, page, busca);
      await btn.update({ components: [c, r] });
    });

    collector.on('end', async () => {
      const { container: c } = buildPage(rows, page, busca);
      await interaction.editReply({ components: [c] }).catch(() => {});
    });
  },
};
