const { SlashCommandBuilder, MessageFlags,
  ContainerBuilder, SeparatorBuilder, TextDisplayBuilder, SeparatorSpacingSize,
} = require('discord.js');

const sep = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);
const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false);
const txt = s => new TextDisplayBuilder().setContent(s);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('webhook-url')
    .setDescription('Mostra a URL atual do webhook Tally e o link de keep-alive para UptimeRobot'),

  async execute(interaction) {
    const domain = process.env.REPLIT_DEV_DOMAIN ?? 'dominio-nao-disponivel';
    const webhookUrl  = `https://${domain}:3001/webhook/tally`;
    const healthUrl   = `https://${domain}:3001/health`;
    const uptimeLabel = 'UptimeRobot Monitor';

    const container = new ContainerBuilder()
      .setAccentColor(0x5865F2)
      .addTextDisplayComponents(txt('## 🔗 URLs do Bot'))
      .addSeparatorComponents(sep())

      .addTextDisplayComponents(txt(
        '📨 **Webhook Tally** _(cole no Tally → Integrations → Webhooks)_\n' +
        `\`\`\`\n${webhookUrl}\n\`\`\``
      ))
      .addSeparatorComponents(sep())

      .addTextDisplayComponents(txt(
        '💓 **Keep-alive / Health Check** _(cole no UptimeRobot)_\n' +
        `\`\`\`\n${healthUrl}\n\`\`\``
      ))
      .addSeparatorComponents(sep())

      .addTextDisplayComponents(txt(
        '### ⏱️ Como manter o bot 24/7 gratuitamente\n' +
        '1. Acesse **https://uptimerobot.com** e crie uma conta grátis\n' +
        '2. Clique em **+ Add New Monitor**\n' +
        '3. Tipo: **HTTP(s)** · Nome: `Oblivion Bot`\n' +
        `4. URL: cole o endereço de health acima\n` +
        '5. Intervalo: **5 minutos** · Salve\n\n' +
        '-# O UptimeRobot faz um ping a cada 5 min, mantendo o bot sempre acordado.'
      ))

      .addSeparatorComponents(gap())
      .addTextDisplayComponents(txt(
        '-# ℹ️ Estas URLs são **permanentes** — não mudam com reinicializações.\n' +
        '-# 🌐 Oblivion League · Sistema de Webhook'
      ));

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
