const { sendModLog } = require('../utils/modLog');
const { createCase } = require('../utils/caseManager');

module.exports = {
    name: 'ban',
    description: 'Ban a user from the Discord server',
    async execute(message, args) {
        if (!message.guild) {
            message.channel.send('This command can only be used in a server.');
            return;
        }

        if (args.length < 1) {
            message.channel.send('Usage: k!ban <@user|userID> [reason]');
            return;
        }

        const userMention = args[0];
        const reason = args.slice(1).join(' ') || 'No reason provided';

        // Extract user ID from mention or direct ID
        const userId = userMention.replace(/[<@!>]/g, '');
        
        try {
            const user = await message.client.users.fetch(userId);
            await message.guild.members.ban(userId, { reason: `${reason} | Banned by ${message.author.tag}` });
            
            // Create case entry
            const caseId = createCase(
                message.guild.id,
                user.id,
                'ban',
                message.author.id,
                message.author.tag,
                reason
            );
            
            message.channel.send(`✅ Banned **${user.tag}** (${user.id})\nReason: ${reason}\n📋 Case #${caseId}`);
            
            // Send to mod log
            await sendModLog(message.guild, 'ban', message.author, user, reason);
        } catch (error) {
            console.error('Error banning user:', error);
            message.channel.send('Failed to ban user. Make sure I have the Ban Members permission and the user exists.');
        }
    }
};
