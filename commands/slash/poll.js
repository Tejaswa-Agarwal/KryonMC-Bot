const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Poll options (separate with |, max 10)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Poll duration in minutes (optional)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(1440)),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        const optionsString = interaction.options.getString('options');
        const duration = interaction.options.getInteger('duration');
        const options = optionsString.split('|').map(opt => opt.trim()).filter(opt => opt.length > 0);

        if (options.length < 2) {
            return interaction.editReply({ content: '❌ Please provide at least 2 options separated by |', ephemeral: true });
        }

        if (options.length > 10) {
            return interaction.editReply({ content: '❌ Maximum 10 options allowed', ephemeral: true });
        }

        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        
        const optionsText = options.map((opt, index) => `${emojis[index]} ${opt}`).join('\n');

        const embed = new EmbedBuilder()
            .setAuthor({ name: '📊 Poll', iconURL: interaction.guild.iconURL() })
            .setTitle(question)
            .setDescription(optionsText)
            .setColor('#0099FF')
            .setFooter({ text: `Poll created by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        if (duration) {
            const endTime = Math.floor((Date.now() + duration * 60 * 1000) / 1000);
            embed.addFields({ name: '⏰ Ends', value: `<t:${endTime}:R>`, inline: true });
        }

        await interaction.editReply({ embeds: [embed] });
        const message = await interaction.fetchReply();

        // Add reactions
        for (let i = 0; i < options.length; i++) {
            try {
                await message.react(emojis[i]);
            } catch (error) {
                console.error('Error adding reaction:', error);
            }
        }

        // If duration is set, edit poll when it ends
        if (duration) {
            setTimeout(async () => {
                try {
                    const updatedMessage = await message.fetch();
                    const reactions = updatedMessage.reactions.cache;
                    
                    let resultsText = '**Final Results:**\n\n';
                    let maxVotes = 0;
                    let winners = [];

                    options.forEach((opt, index) => {
                        const reaction = reactions.get(emojis[index]);
                        const count = reaction ? reaction.count - 1 : 0; // -1 to exclude bot's reaction
                        resultsText += `${emojis[index]} ${opt}: **${count} vote${count !== 1 ? 's' : ''}**\n`;
                        
                        if (count > maxVotes) {
                            maxVotes = count;
                            winners = [opt];
                        } else if (count === maxVotes && count > 0) {
                            winners.push(opt);
                        }
                    });

                    if (winners.length > 0 && maxVotes > 0) {
                        resultsText += `\n🏆 **Winner${winners.length > 1 ? 's' : ''}:** ${winners.join(', ')}`;
                    } else {
                        resultsText += '\n*No votes were cast*';
                    }

                    const endedEmbed = EmbedBuilder.from(embed)
                        .setColor('#FF0000')
                        .setTitle(`${question} [ENDED]`)
                        .setDescription(resultsText)
                        .setFields([]);

                    await message.edit({ embeds: [endedEmbed] });
                } catch (error) {
                    console.error('Error ending poll:', error);
                }
            }, duration * 60 * 1000);
        }
    }
};
