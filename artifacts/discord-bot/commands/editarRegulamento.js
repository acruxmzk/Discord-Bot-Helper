const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const regulamentoDB = require('../utils/regulamentoDB');

const DEFAULTS = {
  data_class1: '20/07/2026',
  data_class2: '21/07/2026',
  data_final:  '23/07/2026',
  link_forms:  '',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editar-regulamento')
    .setDescription('Edita configurações do regulamento (Staff)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub
        .setName('datas')
        .setDescription('Atualiza as datas do campeonato via formulário')
    )
    .addSubcommand(sub =>
      sub
        .setName('link')
        .setDescription('Define ou atualiza o link do Google Forms de inscrição')
    )
    .addSubcommand(sub =>
      sub
        .setName('ver')
        .setDescription('Exibe as configurações atuais salvas no banco')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'datas') {
      const all = await regulamentoDB.getAll();

      const val = (key) => all[key]?.valor ?? DEFAULTS[key];

      const modal = new ModalBuilder()
        .setCustomId('editar_reg_datas')
        .setTitle('📅 Datas do Campeonato');

      const field = (id, label, value) =>
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setValue(value)
            .setMaxLength(20)
            .setRequired(true)
        );

      modal.addComponents(
        field('data_class1', '1ª Classificatória (ex: 20/07/2026)', val('data_class1')),
        field('data_class2', '2ª Classificatória (ex: 21/07/2026)', val('data_class2')),
        field('data_final',  'Grande Final (ex: 23/07/2026)',        val('data_final')),
      );

      await interaction.showModal(modal);
      return;
    }

    if (sub === 'link') {
      const all = await regulamentoDB.getAll();
      const current = all['link_forms']?.valor ?? '';

      const modal = new ModalBuilder()
        .setCustomId('editar_reg_link')
        .setTitle('🔗 Link do Formulário de Inscrição');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('link_forms')
            .setLabel('URL do Google Forms')
            .setStyle(TextInputStyle.Short)
            .setValue(current)
            .setPlaceholder('https://docs.google.com/forms/...')
            .setRequired(true)
            .setMaxLength(500)
        )
      );

      await interaction.showModal(modal);
      return;
    }

    if (sub === 'ver') {
      const all = await regulamentoDB.getAll();
      const entries = Object.entries(all);

      if (entries.length === 0) {
        await interaction.reply({
          content:
            '📋 **Nenhuma configuração salva.**\n' +
            '-# O regulamento está usando os valores padrão do código.',
          ephemeral: true,
        });
        return;
      }

      const lines = entries.map(([key, row]) => {
        const when = new Date(row.atualizado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        return `**${key}**: \`${row.valor}\`\n-# Atualizado por ${row.atualizado_por ?? 'desconhecido'} em ${when}`;
      });

      await interaction.reply({
        content: `📋 **Configurações do Regulamento:**\n\n${lines.join('\n\n')}`,
        ephemeral: true,
      });
    }
  },
};

async function handleEditarRegLinkSubmit(interaction) {
  const url   = interaction.fields.getTextInputValue('link_forms').trim();
  const autor = interaction.user.tag;

  await regulamentoDB.set('link_forms', url, autor);

  await interaction.reply({
    content:
      `✅ **Link do formulário atualizado!**\n\n` +
      `🔗 ${url}\n\n` +
      `-# Use \`/regulamento\` para postar o regulamento com o botão de inscrição.`,
    ephemeral: true,
  });
}

async function handleEditarRegDatasSubmit(interaction) {
  const class1 = interaction.fields.getTextInputValue('data_class1').trim();
  const class2 = interaction.fields.getTextInputValue('data_class2').trim();
  const final  = interaction.fields.getTextInputValue('data_final').trim();
  const autor  = interaction.user.tag;

  await regulamentoDB.set('data_class1', class1, autor);
  await regulamentoDB.set('data_class2', class2, autor);
  await regulamentoDB.set('data_final',  final,  autor);

  await interaction.reply({
    content:
      `✅ **Datas do regulamento atualizadas!**\n\n` +
      `📅 1ª Classificatória: **${class1}**\n` +
      `📅 2ª Classificatória: **${class2}**\n` +
      `🏆 Grande Final: **${final}**\n\n` +
      `-# Use \`/regulamento\` para postar a versão atualizada.`,
    ephemeral: true,
  });
}

module.exports.handleEditarRegDatasSubmit = handleEditarRegDatasSubmit;
module.exports.handleEditarRegLinkSubmit  = handleEditarRegLinkSubmit;
