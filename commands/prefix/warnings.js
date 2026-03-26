const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsFile = path.join(__dirname, '..', '..', 'data', 'warnings.json');

function loadWarnings() {
    if (fs.existsSync(warningsFile)) {
        return JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
    }
    return {};
}

module.exports = {
    name: 'warnings',
    description: 'View warnings for a user',
    async execute(message, args) {
        if (!message.guild) {
            return message.channel.send('This command can only be used in a server.');
        }

        let user;
        if (args.length > 0) {
            const userMention = args[0];
            const userId = userMention.replace(/[<@!>]/g, '');
            try {
                user = await message.client.users.fetch(userId);
            } catch (error) {
                return message.channel.send('❌ Could not find that user.');
            }
        } else {
            user = message.author;
        }

        const warnings = loadWarnings();
        const guildId = message.guild.id;
        const userId = user.id;

        const userWarnings = warnings[guildId]?.[userId] || [];

        if (userWarnings.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('⚠️ User Warnings')
                .setDescription(`${user} has no warnings! 🎉`)
                .setColor(0x2ECC71)
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        }

        const warningsList = userWarnings.map((w, index) => {
            return `**${index + 1}.** ${w.reason}\n📅 <t:${Math.floor(w.timestamp / 1000)}:R> by ${w.moderator}\n🆔 ID: \`${w.id}\``;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setTitle('⚠️ User Warnings')
            .setDescription(`**User:** ${user.tag}\n**Total Warnings:** ${userWarnings.length}\n\n${warningsList}`)
            .setColor(0xE74C3C)
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};