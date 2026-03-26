module.exports = {
    name: 'timeout',
    description: 'Timeout a user in the Discord server',
    async execute(message, args) {
        if (!message.guild) {
            message.channel.send('This command can only be used in a server.');
            return;
        }

        if (args.length < 2) {
            message.channel.send('Usage: !timeout <@user|userID> <duration> [reason]\nExamples: !timeout @user 10m, !timeout @user 1h spam');
            return;
        }

        const userMention = args[0];
        const duration = args[1];
        const reason = args.slice(2).join(' ') || 'No reason provided';

        // Extract user ID from mention or direct ID
        const userId = userMention.replace(/[<@!>]/g, '');
        
        // Parse duration (e.g., 10m, 1h, 1d)
        let timeoutDuration;
        try {
            timeoutDuration = parseDuration(duration);
            if (!timeoutDuration || timeoutDuration < 1000 || timeoutDuration > 28 * 24 * 60 * 60 * 1000) {
                message.channel.send('Invalid duration. Must be between 1 second and 28 days. Examples: 10s, 5m, 1h, 1d');
                return;
            }
        } catch (error) {
            message.channel.send('Invalid duration format. Examples: 10s, 5m, 1h, 1d');
            return;
        }
        
        try {
            const member = await message.guild.members.fetch(userId);
            await member.timeout(timeoutDuration, `${reason} | Timed out by ${message.author.tag}`);
            
            const durationStr = formatDuration(timeoutDuration);
            message.channel.send(`✅ Timed out **${member.user.tag}** for ${durationStr}\nReason: ${reason}`);
        } catch (error) {
            console.error('Error timing out user:', error);
            message.channel.send('Failed to timeout user. Make sure I have the Moderate Members permission and the user is in the server.');
        }
    }
};

function parseDuration(str) {
    const match = str.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };
    
    return value * multipliers[unit];
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
}
