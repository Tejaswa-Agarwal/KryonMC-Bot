const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'rps',
    description: 'Play Rock Paper Scissors',
    async execute(message, args) {
        if (args.length < 1) {
            return message.channel.send('Usage: k!rps <rock|paper|scissors>');
        }

        const userChoice = args[0].toLowerCase();
        if (!['rock', 'paper', 'scissors'].includes(userChoice)) {
            return message.channel.send('❌ Please choose rock, paper, or scissors!');
        }

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
            .setFooter({ text: `Played by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};