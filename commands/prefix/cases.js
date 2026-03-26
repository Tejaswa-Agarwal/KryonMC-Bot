const { EmbedBuilder } = require('discord.js');
const { getUserCases } = require('../utils/caseManager');

module.exports = {
    name: 'cases',
    description: 'View all moderation cases for a user',
    async execute(message, args) {
        if (!message.guild) {
            return message.channel.send('This command can only be used in a server.');
        }

        if (args.length < 1) {
            return message.channel.send('Usage: k!cases <@user|userID> [active]');
        }

        const userMention = args[0];
        const userId = userMention.replace(/[<@!>]/g, '');
        const activeOnly = args[1] && args[1].toLowerCase() === 'active';

        try {
            const user = await message.client.users.fetch(userId);
            const cases = getUserCases(message.guild.id, user.id, activeOnly);

            if (cases.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📋 User Cases')
                    .setDescription(`${user} has no ${activeOnly ? 'active' : ''} cases.`)
                    .setColor(0x2ECC71)
                    .setThumbnail(user.displayAvatarURL())
                    .setTimestamp();

                return message.channel.send({ embeds: [embed] });
            }

            const typeEmojis = {
                'ban': '🔨',
                'unban': '✅',
                'kick': '👢',
                'timeout': '⏰',
                'warn': '⚠️',
                'slowmode': '🐌',
                'lock': '🔒',
                'unlock': '🔓',
                'setnick': '✏️'
            };

            // Sort cases by timestamp (newest first)
            const sortedCases = cases.sort((a, b) => b.timestamp - a.timestamp);

            // Build case list
            const casesList = sortedCases.map(c => {
                const emoji = typeEmojis[c.type] || '📋';
                const status = c.active ? '🟢' : '⚪';
                const details = [];
                
                if (c.duration) details.push(`Duration: ${c.duration}`);
                if (c.channel) details.push(`Channel: ${c.channel}`);
                if (c.oldNick && c.newNick) details.push(`${c.oldNick} → ${c.newNick}`);
                
                const detailStr = details.length > 0 ? `\n   ${details.join(' • ')}` : '';
                
                return `${status} **Case #${c.caseId}** ${emoji} ${c.type.toUpperCase()}\n` +
                       `   📝 ${c.reason}\n` +
                       `   👮 ${c.moderator} • <t:${Math.floor(c.timestamp / 1000)}:R>${detailStr}`;
            }).join('\n\n');

            const embed = new EmbedBuilder()
                .setAuthor({ name: `📋 Moderation Cases - ${user.tag}`, iconURL: user.displayAvatarURL() })
                .setDescription(`**Total Cases:** ${cases.length}\n**Active Cases:** ${cases.filter(c => c.active).length}\n\n${casesList}`)
                .setColor(cases.some(c => c.active && c.type === 'ban') ? 0xE74C3C : 0x5865F2)
                .setThumbnail(user.displayAvatarURL())
                .setFooter({ text: `Requested by ${message.author.tag}` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching user cases:', error);
            message.channel.send('❌ Failed to fetch user cases. Make sure the user ID is valid.');
        }
    }
};
