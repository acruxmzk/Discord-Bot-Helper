const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { toSuperscript } = require('../utils/createRoleUtil');
const { squadCount, squadPrefix, defaultColor } = require('../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('move-squad')
    .setDescription('Move um membro de sua UNIT atual para outra UNIT')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('membro')
        .setDescription('Membro a ser movido')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('numero')
        .setDescription(`Número da nova UNIT (1 a ${squadCount})`)
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(squadCount)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('membro');
    const novoNumero = interaction.options.getInteger('numero');
    const novoNome = `${squadPrefix}${toSuperscript(novoNumero)}`;

    await interaction.deferReply();

    try {
      const [member, botMember] = await Promise.all([
        interaction.guild.members.fetch({ user: user.id, force: true }),
        interaction.guild.members.fetchMe(),
      ]);

      await interaction.guild.roles.fetch();

      const novoRole = interaction.guild.roles.cache.find(r => r.name === novoNome);
      if (!novoRole) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ UNIT de destino não encontrada')
              .setColor('#FF0000')
              .setDescription(`O cargo **${novoNome}** não existe.\nUse **/setup-squads** primeiro para criar os cargos.`)
              .setTimestamp(),
          ],
        });
      }

      const todosUnitRoles = [];
      for (let i = 1; i <= squadCount; i++) {
        const nome = `${squadPrefix}${toSuperscript(i)}`;
        const role = interaction.guild.roles.cache.find(r => r.name === nome);
        if (role) todosUnitRoles.push(role);
      }

      const rolesAtuais = todosUnitRoles.filter(r => member.roles.cache.has(r.id));

      if (rolesAtuais.length === 0 && member.roles.cache.has(novoRole.id)) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('⚠️ Membro já está nesta UNIT')
              .setColor('#FFA500')
              .setDescription(`**${user.displayName ?? user.username}** já está na **${novoNome}** e não possui outra UNIT.`)
              .setTimestamp(),
          ],
        });
      }

      const hierarquiaErros = [...rolesAtuais, novoRole].filter(
        r => r.position >= botMember.roles.highest.position
      );

      if (hierarquiaErros.length > 0) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ Erro de hierarquia')
              .setColor('#FF0000')
              .setDescription(
                `Não consigo gerenciar: **${hierarquiaErros.map(r => r.name).join(', ')}**.\n` +
                `Arraste o cargo do bot acima de todos os cargos de UNIT.`
              )
              .setTimestamp(),
          ],
        });
      }

      const removidos = rolesAtuais.filter(r => r.id !== novoRole.id);

      for (const role of removidos) {
        await member.roles.remove(role, `Move via /move-squad por ${interaction.user.tag}`);
        await new Promise(r => setTimeout(r, 300));
      }

      if (!member.roles.cache.has(novoRole.id)) {
        await member.roles.add(novoRole, `Move via /move-squad por ${interaction.user.tag}`);
      }

      const removidosNomes = removidos.length > 0
        ? removidos.map(r => r.name).join(', ')
        : 'Nenhuma UNIT anterior';

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🔄 Membro movido de UNIT')
            .setColor(defaultColor)
            .addFields(
              { name: '👤 Membro', value: `<@${user.id}>`, inline: false },
              { name: '📤 Saiu de', value: removidosNomes, inline: true },
              { name: '📥 Entrou em', value: novoNome, inline: true },
            )
            .setFooter({ text: `Ação feita por ${interaction.user.tag}` })
            .setTimestamp(),
        ],
      });
    } catch (error) {
      console.error('[move-squad] Erro:', error);

      const msg = error.code === 50013
        ? 'O bot não tem permissão para gerenciar este cargo. Verifique a hierarquia de cargos.'
        : error.message;

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Erro ao mover membro')
            .setColor('#FF0000')
            .setDescription(msg)
            .setTimestamp(),
        ],
      });
    }
  },
};
