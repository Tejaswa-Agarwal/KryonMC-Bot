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
    name: 'clearwarns',
    description: 'Clear all warnings for a user',
    async execute(message, args) {
        if (!message.guild) {
            return message.channel.send('This command can only be used in a server.');
        }

        if (args.length < 1) {
            return message.channel.send('Usage: k!clearwarns <@user|userID>');
        }

        const userMention = args[0];
        const userId = userMention.replace(/[<@!>]/g, '');

        try {
            const user = await message.client.users.fetch(userId);
            const warnings = loadWarnings();

            const guildId = message.guild.id;
            const warnCount = warnings[guildId]?.[userId]?.length || 0;

            if (warnCount === 0) {
                return message.channel.send(`${user} has no warnings to clear.`);
            }

            if (warnings[guildId] && warnings[guildId][userId]) {
                delete warnings[guildId][userId];
                saveWarnings(warnings);
            }

            message.channel.send(`✅ Cleared **${warnCount}** warning(s) for ${user}`);
        } catch (error) {
            console.error('Error clearing warnings:', error);
            message.channel.send('❌ Failed to clear warnings. Make sure the user ID is valid.');
        }
    }
};