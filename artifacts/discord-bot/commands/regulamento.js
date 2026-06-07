const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { defaultColor } = require('../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regulamento')
    .setDescription('Exibe o regulamento completo da Oblivion League'),

  async execute(interaction) {
    await interaction.deferReply();

    const embeds = [
      new EmbedBuilder()
        .setTitle('🌐 𝐎𝐁𝐋𝐈𝐕𝐈𝐎𝐍 𝐋𝐄𝐀𝐆𝐔𝐄 🌐')
        .setColor(defaultColor)
        .addFields(
          {
            name: '📅 Cronograma',
            value: [
              '🗓️ 08/07/2026 — 1ª Classificatória',
              '🗓️ 09/07/2026 — 2ª Classificatória',
              '🏆 11/07/2026 — Grande Final',
            ].join('\n'),
            inline: true,
          },
          {
            name: '🕒 Horários',
            value: [
              '🎯 Classificatórias — 20h00',
              '🏆 Grande Final — 22h00',
            ].join('\n'),
            inline: true,
          },
          {
            name: '💰 Premiação',
            value: [
              '🥇 1º Lugar — R$ 1.000,00',
              '🥈 2º Lugar — R$ 500,00',
              '🥉 3º Lugar — R$ 250,00',
              '🎖️ 4º Lugar — R$ 200,00',
              '🏅 MVP — R$ 50,00',
              '💵 **Total: R$ 2.000,00**',
            ].join('\n'),
            inline: false,
          },
          {
            name: '🎮 Configurações',
            value: [
              '👥 Modo: Squad',
              '❤️ Reanimação Automática',
              '♾️ Munição Infinita',
            ].join('\n'),
            inline: true,
          },
          {
            name: '🗺️ Mapas',
            value: [
              '🏝️ Isolated',
              '🌆 Blackout',
            ].join('\n'),
            inline: true,
          },
          {
            name: '⚡ Formato',
            value: [
              '🎯 **Classificatórias:** 3 Quedas',
              '🏆 **Final:** 4 Quedas',
              '• 2 Com Habilidades',
              '• 2 Sem Habilidades',
            ].join('\n'),
            inline: false,
          }
        )
        .setFooter({ text: 'Oblivion League • Regulamento Oficial' }),

      new EmbedBuilder()
        .setColor(defaultColor)
        .addFields(
          {
            name: '📜 Regras Gerais',
            value: [
              '🏷️ Todos os membros deverão utilizar a mesma TAG.',
              '📸 Denúncias apenas com provas.',
              '👤 Jogadores não cadastrados não poderão participar.',
              '🚫 Equipes com jogadores não inscritos poderão ser desclassificadas.',
              '⚔️ Permitido até 3 lines por clã.',
            ].join('\n'),
          },
          {
            name: '🚫 Proibições Gerais',
            value: [
              '💻 Programas de trapaça',
              '🖥️ Emuladores',
              '📱 Mobiladores',
              '🌐 VPN',
              '🚗 Atropelar',
              '📢 Call para todos',
              '😡 Comportamentos antidesportivos',
              '💬 Brigas no chat',
            ].join('\n'),
            inline: true,
          },
          {
            name: '🚫 Veículos Proibidos',
            value: [
              '🚚 Caminhão',
              '🛡️ Tanque',
              '✈️ Jato',
              '🚀 Bike Voadora',
            ].join('\n'),
            inline: true,
          },
          {
            name: '🔫 Armas Proibidas',
            value: [
              '🎯 Munições especiais de snipers',
              '💣 Bazuca',
              '💥 Thumper',
              '⚡ Tempestade',
              '🎖️ Aniquilador',
              '🔫 Máquina de Guerra',
              '🔥 Purificador',
              'ℹ️ FHJ apenas contra veículos.',
            ].join('\n'),
            inline: true,
          },
          {
            name: '🚫 Habilidades Proibidas',
            value: [
              '❌ Desperado',
              '❌ Onda de Choque',
              '❌ Desorientação',
              '❌ Bombado',
              '❌ Incendiário',
              '❌ Todas as torretas',
              '❌ Ataque de Dispersão',
            ].join('\n'),
            inline: true,
          }
        )
        .setFooter({ text: 'Oblivion League • Regulamento Oficial' }),

      new EmbedBuilder()
        .setColor(defaultColor)
        .addFields(
          {
            name: '🔎 Verificação',
            value: [
              '🎥 Vídeos obrigatórios de todas as quedas.',
              '',
              '📋 **Requisitos:**',
              '• Mostrar barra de notificações',
              '• Mostrar horário',
              '• Mostrar aplicativos abertos',
              '• Mostrar HUD',
              '',
              '🎞️ 4 vídeos por jogador • 16 vídeos por equipe',
              '⏰ Prazo: até 02h00 da manhã após o campeonato.',
              '',
              '⚠️ Nenhum jogador ou equipe estará isento de verificação.',
              '🖥️ A staff poderá solicitar abertura de tela a qualquer momento.',
              '🚫 Recusa de verificação pode resultar em desclassificação e banimento.',
            ].join('\n'),
          },
          {
            name: '🎙️ Discord',
            value: [
              '👥 Todos os jogadores deverão estar presentes no Discord antes do início.',
              '🔍 A presença poderá ser usada para conferência de lineup e verificações.',
              '⚠️ Equipes ausentes poderão sofrer punições ou desclassificação.',
            ].join('\n'),
          },
          {
            name: '❗ Penalidades',
            value: [
              '➖ Armas/habilidades proibidas → **-50 pontos**',
              '🚫 Comportamento antidesportivo → **Expulsão e possível banimento**',
              '🌐 Uso de VPN → **Expulsão imediata**',
              '💻 Uso de trapaças → **Banimento permanente**',
              '💬 Brigas no chat → 1ª: Advertência | 2ª: -50 pontos',
              '🚗 Atropelar ou Call para Todos → **Queda zerada**',
            ].join('\n'),
          },
          {
            name: '🏆 Pontuação — Sem Habilidades',
            value: [
              '🥇 1º — 15 pts  |  🥈 2º — 13 pts  |  🥉 3º — 11 pts',
              '🎖️ 4º — 10 pts  |  🏅 5º — 9 pts  |  🏅 6º — 8 pts',
              '🏅 7º — 7 pts  |  🏅 8º — 6 pts  |  🏅 9º — 5 pts  |  🏅 10º — 4 pts',
              '🩸 Kill = 1 ponto',
            ].join('\n'),
            inline: true,
          },
          {
            name: '⚡ Pontuação — Com Habilidades',
            value: [
              '🥇 1º — 15 pts  |  🥈 2º — 13 pts  |  🥉 3º — 11 pts',
              '🎖️ 4º — 10 pts  |  🏅 5º — 9 pts  |  🏅 6º — 8 pts',
              '🩸 Kill = 1 ponto',
            ].join('\n'),
            inline: true,
          }
        )
        .setFooter({ text: 'Oblivion League • Regulamento Oficial' })
        .setTimestamp(),
    ];

    await interaction.editReply({ embeds: [embeds[0]] });
    await interaction.followUp({ embeds: [embeds[1]] });
    await interaction.followUp({ embeds: [embeds[2]] });
  },
};
