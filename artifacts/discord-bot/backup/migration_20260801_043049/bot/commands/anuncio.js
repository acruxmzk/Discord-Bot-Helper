const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

function sep() {
  return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
}
function gap() {
  return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false);
}
function txt(c) { return new TextDisplayBuilder().setContent(c); }

const CORES = {
  azul:     0x5865F2,
  verde:    0x00C851,
  amarelo:  0xFFD700,
  vermelho: 0xFF4444,
  laranja:  0xFFA500,
  roxo:     0x9B59B6,
};

const ICONES = {
  geral:      '📢',
  importante: '⚠️',
  inicio:     '🚀',
  resultado:  '🏆',
  atencao:    '🔔',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anuncio')
    .setDescription('Enviar anúncio formatado em um canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(o =>
      o.setName('canal').setDescription('Canal onde o anúncio será enviado').setRequired(true)
    )
    .addStringOption(o =>
      o.setName('titulo').setDescription('Título do anúncio').setRequired(true).setMaxLength(80)
    )
    .addStringOption(o =>
      o.setName('mensagem').setDescription('Conteúdo do anúncio').setRequired(true).setMaxLength(1800)
    )
    .addStringOption(o =>
      o.setName('tipo').setDescription('Tipo de anúncio (define ícone e cor)').setRequired(false)
        .addChoices(
          { name: '📢 Geral',       value: 'geral' },
          { name: '⚠️ Importante',  value: 'importante' },
          { name: '🚀 Início',      value: 'inicio' },
          { name: '🏆 Resultado',   value: 'resultado' },
          { name: '🔔 Atenção',     value: 'atencao' },
        )
    )
    .addStringOption(o =>
      o.setName('cor').setDescription('Cor da borda (sobrescreve tipo)').setRequired(false)
        .addChoices(
          { name: '🔵 Azul',     value: 'azul' },
          { name: '🟢 Verde',    value: 'verde' },
          { name: '🟡 Amarelo',  value: 'amarelo' },
          { name: '🔴 Vermelho', value: 'vermelho' },
          { name: '🟠 Laranja',  value: 'laranja' },
          { name: '🟣 Roxo',     value: 'roxo' },
        )
    )
    .addStringOption(o =>
      o.setName('mencao').setDescription('Marcar @everyone, @here ou um cargo pelo nome').setRequired(false)
    ),

  async execute(interaction) {
    const canal    = interaction.options.getChannel('canal');
    const titulo   = interaction.options.getString('titulo');
    const mensagem = interaction.options.getString('mensagem');
    const tipo     = interaction.options.getString('tipo') ?? 'geral';
    const corKey   = interaction.options.getString('cor');
    const mencao   = interaction.options.getString('mencao');

    const icone = ICONES[tipo];
    let acento = CORES[corKey] ?? (
      tipo === 'importante' ? CORES.laranja :
      tipo === 'inicio'     ? CORES.verde   :
      tipo === 'resultado'  ? CORES.amarelo :
      tipo === 'atencao'    ? CORES.vermelho :
      CORES.azul
    );

    // ── Resolve menção ────────────────────────────────────────────────────
    let mencaoStr = '';
    if (mencao) {
      if (mencao === '@everyone' || mencao === 'everyone') {
        mencaoStr = '@everyone';
      } else if (mencao === '@here' || mencao === 'here') {
        mencaoStr = '@here';
      } else {
        const role = interaction.guild.roles.cache.find(
          r => r.name.toLowerCase() === mencao.toLowerCase()
        );
        mencaoStr = role ? `<@&${role.id}>` : mencao;
      }
    }

    const agora = Math.floor(Date.now() / 1000);

    const container = new ContainerBuilder()
      .setAccentColor(acento)
      .addTextDisplayComponents(txt(`### ${icone}  ${titulo}`))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(txt(mensagem))
      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        `-# 📅 <t:${agora}:F>  ·  publicado por ${interaction.user.displayName}`
      ));

    // ── Envia no canal alvo ───────────────────────────────────────────────
    await canal.send({
      content: mencaoStr || undefined,
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    // ── Confirmação ephemeral ─────────────────────────────────────────────
    await interaction.reply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x00C851)
          .addTextDisplayComponents(txt(
            `### ✅ Anúncio enviado\nPublicado em <#${canal.id}>.`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true,
    });
  },
};
