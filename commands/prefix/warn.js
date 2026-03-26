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

function saveWarnings(warnings) {
    fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
}

module.exports = {
    name: 'warn',
    description: 'Warn a user',
    async execute(message, args) {
        if (!message.guild) {
            return message.channel.send('This command can only be used in a server.');
        }

        if (args.length < 2) {
            return message.channel.send('Usage: k!warn <@user|userID> <reason>');
        }

        const userMention = args[0];
        const userId = userMention.replace(/[<@!>]/g, '');
        const reason = args.slice(1).join(' ');

        try {
            const user = await message.client.users.fetch(userId);
            const warnings = loadWarnings();

            const guildId = message.guild.id;

            if (!warnings[guildId]) warnings[guildId] = {};
            if (!warnings[guildId][userId]) warnings[guildId][userId] = [];

            const warning = {
                id: Date.now(),
                reason,
                moderator: message.author.tag,
                moderatorId: message.author.id,
                timestamp: Date.now()
            };

            warnings[guildId][userId].push(warning);
            saveWarnings(warnings);

            const warnCount = warnings[guildId][userId].length;

            const embed = new EmbedBuilder()
                .setTitle('⚠️ User Warned')
                .setColor(0xF39C12)
                .addFields(
                    { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: '👮 Moderator', value: message.author.tag, inline: true },
                    { name: '📊 Total Warnings', value: `\`${warnCount}\``, inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setThumbnail(user.displayAvatarURL())
                .setFooter({ text: `Warning ID: ${warning.id}` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

            try {
                await user.send({ embeds: [embed] });
            } catch (error) {
                console.log('Could not DM user about warning');
            }
        } catch (error) {
            console.error('Error warning user:', error);
            message.channel.send('❌ Failed to warn user. Make sure the user ID is valid.');
        }
    }
};