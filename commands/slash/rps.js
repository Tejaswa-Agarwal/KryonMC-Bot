const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Play Rock Paper Scissors')
        .addStringOption(option =>
            option.setName('choice')
                .setDescription('Your choice')
                .setRequired(true)
                .addChoices(
                    { name: '🪨 Rock', value: 'rock' },
                    { name: '📄 Paper', value: 'paper' },
                    { name: '✂️ Scissors', value: 'scissors' }
                )),
    async execute(interaction) {
        const userChoice = interaction.options.getString('choice');
        const choices = ['rock', 'paper', 'scissors'];
        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };

        let result;
        let color;
        if (userChoice === botChoice) {
            result = "It's a tie!";
            color = 0xF39C12;
        } else if (
            (userChoice === 'rock' && botChoice === 'scissors') ||
            (userChoice === 'paper' && botChoice === 'rock') ||
            (userChoice === 'scissors' && botChoice === 'paper')
        ) {
            result = 'You win! 🎉';
            color = 0x2ECC71;
        } else {
            result = 'I win! 😎';
            color = 0xE74C3C;
        }

        const embed = new EmbedBuilder()
            .setTitle('🎮 Rock Paper Scissors')
            .setColor(color)
            .addFields(
                { name: '👤 Your Choice', value: `${emojis[userChoice]} ${userChoice.toUpperCase()}`, inline: true },
                { name: '🤖 My Choice', value: `${emojis[botChoice]} ${botChoice.toUpperCase()}`, inline: true },
                { name: '🏆 Result', value: result, inline: false }
            )
            .setFooter({ text: `Played by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};