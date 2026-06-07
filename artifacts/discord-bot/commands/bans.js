const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { listBans, searchBans } = require('../utils/banDB');

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function gap() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bans')
    .setDescription('Listar jogadores banidos da Oblivion League')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName('busca').setDescription('Filtrar por UID (parcial)').setRequired(false).setMaxLength(30)
    ),

  async execute(interaction) {
    const busca = interaction.options.getString('busca');
    const rows  = busca ? searchBans(busca) : listBans(25);

    if (rows.length === 0) {
      const msg = busca
        ? `Nenhum resultado para \`${busca}\`.`
        : 'Nenhum jogador banido registrado.';
      await interaction.reply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(txt(`### 📋 Banidos\n\n-# ${msg}`)),
        ],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });
      return;
    }

    const linhas = rows.map((r, i) =>
      `\`${String(i + 1).padStart(2, '0')}\`  \`${r.uid}\`  ·  ${r.reason}  ·  *${r.banned_at}*`
    ).join('\n');

    const titulo = busca
      ? `### 🔍 Busca: \`${busca}\` — ${rows.length} resultado(s)`
      : `### 🚫 Jogadores Banidos — ${rows.length} registro(s)`;

    await interaction.reply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xFF4444)
          .addTextDisplayComponents(txt(titulo))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(linhas))
          .addSeparatorComponents(gap())
          .addTextDisplayComponents(txt(
            busca
              ? `-# Use \`/verificar [uid]\` para ver detalhes completos.`
              : `-# Exibindo os ${rows.length} mais recentes · Use \`/verificar [uid]\` para detalhes.`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true,
    });
  },
};
