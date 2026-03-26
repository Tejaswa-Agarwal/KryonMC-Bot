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
    name: 'removewarn',
    description: 'Remove a specific warning from a user',
    async execute(message, args) {
        if (!message.guild) {
            return message.channel.send('This command can only be used in a server.');
        }

        if (args.length < 2) {
            return message.channel.send('Usage: k!removewarn <@user|userID> <warningID>');
        }

        const userMention = args[0];
        const userId = userMention.replace(/[<@!>]/g, '');
        const warnId = parseInt(args[1]);

        if (isNaN(warnId)) {
            return message.channel.send('❌ Please provide a valid warning ID number.');
        }

        try {
            const user = await message.client.users.fetch(userId);
            const warnings = loadWarnings();

            const guildId = message.guild.id;

            if (!warnings[guildId] || !warnings[guildId][userId] || warnings[guildId][userId].length === 0) {
                return message.channel.send(`${user} has no warnings.`);
            }

            const warnIndex = warnings[guildId][userId].findIndex(w => w.id === warnId);

            if (warnIndex === -1) {
                return message.channel.send(`❌ Warning ID ${warnId} not found for ${user}.`);
            }

            const removedWarn = warnings[guildId][userId].splice(warnIndex, 1)[0];
            saveWarnings(warnings);

            const remainingWarns = warnings[guildId][userId].length;

            const embed = new EmbedBuilder()
                .setTitle('✅ Warning Removed')
                .setColor(0x2ECC71)
                .addFields(
                    { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: '👮 Removed By', value: message.author.tag, inline: true },
                    { name: '📊 Remaining Warnings', value: `\`${remainingWarns}\``, inline: true },
                    { name: '📝 Removed Warning', value: removedWarn.reason, inline: false },
                    { name: '🆔 Warning ID', value: `\`${warnId}\``, inline: true }
                )
                .setThumbnail(user.displayAvatarURL())
                .setFooter({ text: `Action by ${message.author.tag}` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

            try {
                await user.send({ embeds: [
                    new EmbedBuilder()
                        .setTitle('✅ Warning Removed')
                        .setDescription(`A warning has been removed from your record in **${message.guild.name}**`)
                        .setColor(0x2ECC71)
                        .addFields(
                            { name: '📝 Warning Removed', value: removedWarn.reason },
                            { name: '📊 Remaining Warnings', value: `\`${remainingWarns}\`` }
                        )
                        .setTimestamp()
                ]});
            } catch (error) {
                console.log('Could not DM user about warning removal');
            }
        } catch (error) {
            console.error('Error removing warning:', error);
            message.channel.send('❌ Failed to remove warning. Make sure the user ID is valid.');
        }
    }
};
