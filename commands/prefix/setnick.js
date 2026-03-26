module.exports = {
    name: 'setnick',
    description: 'Change a user\'s nickname',
    async execute(message, args) {
        if (!message.guild) {
            return message.channel.send('This command can only be used in a server.');
        }

        if (args.length < 1) {
            return message.channel.send('Usage: k!setnick <@user|userID> [nickname]');
        }

        const userMention = args[0];
        const userId = userMention.replace(/[<@!>]/g, '');
        const nickname = args.slice(1).join(' ') || null;

        try {
            const member = await message.guild.members.fetch(userId);
            await member.setNickname(nickname);

            if (nickname) {
                message.channel.send(`✅ Changed ${member.user}'s nickname to **${nickname}**`);
            } else {
                message.channel.send(`✅ Reset ${member.user}'s nickname`);
            }
        } catch (error) {
            console.error('Error setting nickname:', error);
            message.channel.send('❌ Failed to change nickname. Make sure I have permission and the user is in the server.');
        }
    }
};