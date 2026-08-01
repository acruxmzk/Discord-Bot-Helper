const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  OverwriteType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

const SUPPORT_CATEGORY = 'Suporte';
const STAFF_ROLE       = 'STAFF';
const MANAGER_ROLE     = 'MANAGER';

function sep() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true); }
function gap() { return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false); }
function txt(c) { return new TextDisplayBuilder().setContent(c); }

async function findOrCreateSupportCategory(guild) {
  let cat = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === SUPPORT_CATEGORY
  );
  if (!cat) {
    cat = await guild.channels.create({
      name: SUPPORT_CATEGORY,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
      ],
    });
  }
  return cat;
}

async function handleSupportOpen(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const { guild, user } = interaction;

  const chName = `suporte-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`;

  await guild.channels.fetch().catch(() => {});
  const duplicate = guild.channels.cache.find(c => c.name === chName);
  if (duplicate) {
    return interaction.editReply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0xFFA500)
          .addTextDisplayComponents(txt(
            `### ⚠️  Ticket já aberto\n` +
            `Você já tem um atendimento ativo: <#${duplicate.id}>\n` +
            `-# Descreva sua situação lá ou aguarde o retorno da staff.`
          )),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  await guild.roles.fetch().catch(() => {});
  const staffRole   = guild.roles.cache.find(r => r.name === STAFF_ROLE);
  const managerRole = guild.roles.cache.find(r => r.name === MANAGER_ROLE);
  const category    = await findOrCreateSupportCategory(guild);

  const overwrites = [
    { id: guild.roles.everyone.id, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: user.id, type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  const staffPerms = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.EmbedLinks,
  ];

  if (staffRole)   overwrites.push({ id: staffRole.id,   type: OverwriteType.Role, allow: staffPerms });
  if (managerRole) overwrites.push({ id: managerRole.id, type: OverwriteType.Role, allow: staffPerms });

  const channel = await guild.channels.create({
    name:                 chName,
    type:                 ChannelType.GuildText,
    parent:               category.id,
    topic:                `Suporte — ${user.tag} · ${new Date().toLocaleDateString('pt-BR')}`,
    permissionOverwrites: overwrites,
  });

  const staffMention = staffRole ? `<@&${staffRole.id}>` : '@STAFF';
  const ts = Math.floor(Date.now() / 1000);

  await channel.send({
    components: [
      new ContainerBuilder()
        .setAccentColor(0xFFA500)
        .addTextDisplayComponents(txt(
          `### 🎫  Atendimento — OBLIVION\n` +
          `-# ${staffMention} · novo ticket aberto`
        ))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(txt(
          `👤  **Usuário:** <@${user.id}>\n` +
          `🕐  **Aberto em:** <t:${ts}:F>`
        ))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(txt(
          '📋  **Descreva sua situação** neste canal.\n\n' +
          'Use este espaço para relatar:\n' +
          '▸  Dúvidas sérias sobre o servidor ou a liga\n' +
          '▸  Denúncias de jogadores ou conduta inadequada\n' +
          '▸  Problemas técnicos ou de acesso\n\n' +
          '-# A staff responderá o mais breve possível. Seja claro e objetivo.'
        ))
        .addSeparatorComponents(gap())
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('ticket_close')
              .setLabel('🔒  Fechar Atendimento')
              .setStyle(ButtonStyle.Danger)
          )
        ),
    ],
    flags: MessageFlags.IsComponentsV2,
  });

  await interaction.editReply({
    components: [
      new ContainerBuilder()
        .setAccentColor(0x00C851)
        .addTextDisplayComponents(txt(
          `### ✅  Atendimento criado!\n` +
          `Seu canal privado: <#${channel.id}>\n` +
          `-# Descreva sua situação lá. Nossa equipe responderá em breve.`
        )),
    ],
    flags: MessageFlags.IsComponentsV2,
  });
}

module.exports = { handleSupportOpen };
