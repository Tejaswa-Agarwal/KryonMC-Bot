const { sendModLog } = require('../utils/modLog');
const { createCase } = require('../utils/caseManager');

module.exports = {
    name: 'unban',
    description: 'Unban a user from the Discord server',
    async execute(message, args) {
        if (!message.guild) {
            message.channel.send('This command can only be used in a server.');
            return;
        }

        if (args.length < 1) {
            message.channel.send('Usage: k!unban <userID> [reason]');
            return;
        }

        const userId = args[0];
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            const bannedUsers = await message.guild.bans.fetch();
            const bannedUser = bannedUsers.find(ban => ban.user.id === userId);

            if (!bannedUser) {
                message.channel.send('User is not banned or user ID not found.');
                return;
            }

            await message.guild.members.unban(userId, `${reason} | Unbanned by ${message.author.tag}`);
            
            // Create case entry
            const caseId = createCase(
                message.guild.id,
                userId,
                'unban',
                message.author.id,
                message.author.tag,
                reason
            );
            
            message.channel.send(`✅ Unbanned **${bannedUser.user.tag}** (${userId})\nReason: ${reason}\n📋 Case #${caseId}`);
            
            // Send to mod log
            await sendModLog(message.guild, 'unban', message.author, bannedUser.user, reason);
        } catch (error) {
            console.error('Error unbanning user:', error);
            message.channel.send('Failed to unban user. Make sure I have the Ban Members permission.');
        }
    }
};
