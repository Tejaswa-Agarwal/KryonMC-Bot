const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8ball a question')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Your question for the 8ball')
                .setRequired(true)),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        
        const responses = [
            { text: 'It is certain.', color: '#00FF00', type: 'Affirmative' },
            { text: 'It is decidedly so.', color: '#00FF00', type: 'Affirmative' },
            { text: 'Without a doubt.', color: '#00FF00', type: 'Affirmative' },
            { text: 'Yes - definitely.', color: '#00FF00', type: 'Affirmative' },
            { text: 'You may rely on it.', color: '#00FF00', type: 'Affirmative' },
            { text: 'As I see it, yes.', color: '#00FF00', type: 'Affirmative' },
            { text: 'Most likely.', color: '#00FF00', type: 'Affirmative' },
            { text: 'Outlook good.', color: '#00FF00', type: 'Affirmative' },
            { text: 'Yes.', color: '#00FF00', type: 'Affirmative' },
            { text: 'Signs point to yes.', color: '#00FF00', type: 'Affirmative' },
            { text: 'Reply hazy, try again.', color: '#FFA500', type: 'Non-Committal' },
            { text: 'Ask again later.', color: '#FFA500', type: 'Non-Committal' },
            { text: 'Better not tell you now.', color: '#FFA500', type: 'Non-Committal' },
            { text: 'Cannot predict now.', color: '#FFA500', type: 'Non-Committal' },
            { text: 'Concentrate and ask again.', color: '#FFA500', type: 'Non-Committal' },
            { text: "Don't count on it.", color: '#FF0000', type: 'Negative' },
            { text: 'My reply is no.', color: '#FF0000', type: 'Negative' },
            { text: 'My sources say no.', color: '#FF0000', type: 'Negative' },
            { text: 'Outlook not so good.', color: '#FF0000', type: 'Negative' },
            { text: 'Very doubtful.', color: '#FF0000', type: 'Negative' }
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];
        
        const embed = new EmbedBuilder()
            .setAuthor({ name: '🔮 Magic 8Ball', iconURL: interaction.user.displayAvatarURL() })
            .setColor(response.color)
            .setTitle(question)
            .setDescription(`**${response.text}**`)
            .addFields({ name: 'Response Type', value: response.type, inline: true })
            .setFooter({ text: `Asked by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/8-ball_icon.svg/240px-8-ball_icon.svg.png')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
