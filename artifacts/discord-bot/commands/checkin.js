const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ChannelType,
} = require('discord.js');

function sep() {
  return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
}
function gap() {
  return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false);
}
function txt(c) { return new TextDisplayBuilder().setContent(c); }

// ── Estado em memória (reset ao reiniciar o bot) ───────────────────────────────
// Map<fase, Map<equipe, { confirmadoPor, timestamp }>>
const checkins = new Map();

function getFase(fase) {
  if (!checkins.has(fase)) checkins.set(fase, new Map());
  return checkins.get(fase);
}

function findLogChannel(guild) {
  return guild.channels.cache.find(
    c => c.type === ChannelType.GuildText &&
         (c.name.toLowerCase().includes('staff-log') ||
          c.name.toLowerCase().includes('logs') ||
          c.name.toLowerCase().includes('log'))
  ) ?? null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkin')
    .setDescription('Gerenciar check-in de equipes antes das partidas')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('confirmar')
        .setDescription('Confirmar presença de uma equipe')
        .addStringOption(o =>
          o.setName('fase').setDescription('Fase da partida').setRequired(true)
            .addChoices(
              { name: '1ª Classificatória', value: 'Classificatória 1' },
              { name: '2ª Classificatória', value: 'Classificatória 2' },
              { name: 'Grande Final',       value: 'Grande Final' },
            )
        )
        .addStringOption(o =>
          o.setName('equipe').setDescription('Nome do clã/equipe').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('remover')
        .setDescription('Remover check-in de uma equipe')
        .addStringOption(o =>
          o.setName('fase').setDescription('Fase da partida').setRequired(true)
            .addChoices(
              { name: '1ª Classificatória', value: 'Classificatória 1' },
              { name: '2ª Classificatória', value: 'Classificatória 2' },
              { name: 'Grande Final',       value: 'Grande Final' },
            )
        )
        .addStringOption(o =>
          o.setName('equipe').setDescription('Nome do clã/equipe').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('lista')
        .setDescription('Ver lista de check-in de uma fase')
        .addStringOption(o =>
          o.setName('fase').setDescription('Fase para consultar').setRequired(true)
            .addChoices(
              { name: '1ª Classificatória', value: 'Classificatória 1' },
              { name: '2ª Classificatória', value: 'Classificatória 2' },
              { name: 'Grande Final',       value: 'Grande Final' },
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('resetar')
        .setDescription('Resetar check-in de uma fase')
        .addStringOption(o =>
          o.setName('fase').setDescription('Fase para resetar').setRequired(true)
            .addChoices(
              { name: '1ª Classificatória', value: 'Classificatória 1' },
              { name: '2ª Classificatória', value: 'Classificatória 2' },
              { name: 'Grande Final',       value: 'Grande Final' },
              { name: '⚠️ TODAS',           value: 'ALL' },
            )
        )
    ),

  async execute(interaction) {
    const sub  = interaction.options.getSubcommand();
    const fase = interaction.options.getString('fase');

    // ── CONFIRMAR ────────────────────────────────────────────────────────────
    if (sub === 'confirmar') {
      const equipe = interaction.options.getString('equipe').trim();
      const mapa   = getFase(fase);
      const agora  = Math.floor(Date.now() / 1000);

      const jaConfirmou = mapa.has(equipe);
      mapa.set(equipe, { confirmadoPor: interaction.user.tag, timestamp: agora });

      // Log no canal de staff
      const logCh = findLogChannel(interaction.guild);
      if (logCh) {
        await logCh.send({
          components: [
            new ContainerBuilder()
              .setAccentColor(0x00C851)
              .addTextDisplayComponents(txt(
                `### ✅ Check-in Confirmado\n` +
                `**Equipe:** ${equipe}\n` +
                `**Fase:** ${fase}\n` +
                `**Confirmado por:** <@${interaction.user.id}>\n` +
                `**Horário:** <t:${agora}:T>`
              )),
          ],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      }

      await interaction.reply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0x00C851)
            .addTextDisplayComponents(txt(
              `### ✅ Check-in ${jaConfirmou ? 'Atualizado' : 'Confirmado'}\n` +
              `**${equipe}** marcada como presente na **${fase}**.\n` +
              `**Total confirmadas:** ${mapa.size}`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });
      return;
    }

    // ── REMOVER ──────────────────────────────────────────────────────────────
    if (sub === 'remover') {
      const equipe = interaction.options.getString('equipe').trim();
      const mapa   = getFase(fase);

      if (!mapa.has(equipe)) {
        await interaction.reply({
          components: [
            new ContainerBuilder()
              .setAccentColor(0xFF4444)
              .addTextDisplayComponents(txt(
                `### ❌ Não encontrada\n**${equipe}** não está na lista de check-in de **${fase}**.`
              )),
          ],
          flags: MessageFlags.IsComponentsV2,
          ephemeral: true,
        });
        return;
      }

      mapa.delete(equipe);
      await interaction.reply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFFA500)
            .addTextDisplayComponents(txt(
              `### 🗑️ Check-in Removido\n**${equipe}** removida da **${fase}**.\n**Restam:** ${mapa.size} equipe(s) confirmada(s).`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });
      return;
    }

    // ── LISTA ────────────────────────────────────────────────────────────────
    if (sub === 'lista') {
      const mapa = getFase(fase);

      if (mapa.size === 0) {
        await interaction.reply({
          components: [
            new ContainerBuilder()
              .setAccentColor(0x5865F2)
              .addTextDisplayComponents(txt(
                `### 📋 Check-in — ${fase}\n\n-# Nenhuma equipe confirmada ainda.`
              )),
          ],
          flags: MessageFlags.IsComponentsV2,
        });
        return;
      }

      const linhas = [...mapa.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .map(([equipe, info], i) =>
          `\`${String(i + 1).padStart(2, '0')}\`  **${equipe}** — <t:${info.timestamp}:T>`
        )
        .join('\n');

      await interaction.reply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0x00C851)
            .addTextDisplayComponents(txt(`### 📋 Check-in — ${fase}`))
            .addSeparatorComponents(gap())
            .addTextDisplayComponents(txt(linhas))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(
              `✅  **${mapa.size}** equipe(s) confirmada(s)`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    // ── RESETAR ──────────────────────────────────────────────────────────────
    if (sub === 'resetar') {
      if (fase === 'ALL') {
        checkins.clear();
        await interaction.reply({
          components: [
            new ContainerBuilder()
              .setAccentColor(0xFF4444)
              .addTextDisplayComponents(txt('### 🗑️ Check-in Resetado\nTodas as fases foram limpas.')),
          ],
          flags: MessageFlags.IsComponentsV2,
          ephemeral: true,
        });
        return;
      }

      const mapa = getFase(fase);
      const total = mapa.size;
      mapa.clear();
      await interaction.reply({
        components: [
          new ContainerBuilder()
            .setAccentColor(0xFF4444)
            .addTextDisplayComponents(txt(
              `### 🗑️ Check-in Resetado\n**${fase}** limpa. (${total} entrada(s) removida(s))`
            )),
        ],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true,
      });
    }
  },
};
