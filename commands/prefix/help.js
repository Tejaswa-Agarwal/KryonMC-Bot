const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Display all available commands',
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setAuthor({ name: '📚 Command Guide', iconURL: message.client.user.displayAvatarURL() })
            .setTitle('Available Bot Commands')
            .setColor(0x5865F2)
            .setDescription('Use `/command` or `k!command` to execute commands')
            .addFields(
                { 
                    name: '🛡️ Moderation Commands', 
                    value: '```css\n' +
                           'k!ban • k!unban • k!kick • k!timeout\n' +
                           'k!warn • k!warnings • k!removewarn\n' +
                           'k!cases • k!removecase\n' +
                           'k!slowmode • k!lock • k!unlock\n' +
                           'k!setnick • k!clearwarns\n' +
                           '```',
                    inline: false 
                },
                { 
                    name: '🔧 Utility Commands', 
                    value: '```css\n' +
                           'k!help • k!ping • k!avatar • k!userinfo\n' +
                           'k!serverinfo • k!botinfo • k!roleinfo\n' +
                           'k!leaderboard • k!invite • k!mywarns\n' +
                           '```',
                    inline: false 
                },
                { 
                    name: '⚙️ Admin Commands', 
                    value: '```css\n' +
                           'k!announce • k!say • k!command\n' +
                           'k!purge • k!purgeuser\n' +
                           '```',
                    inline: false 
                },
                { 
                    name: '🎮 Fun Commands', 
                    value: '```css\n' +
                           'k!8ball • k!coinflip • k!roll • k!poll\n' +
                           'k!rps • k!joke\n' +
                           '```',
                    inline: false 
                },
                { 
                    name: '🎉 Giveaway Commands', 
                    value: '```css\n' +
                           'k!giveaway\n' +
                           '```',
                    inline: false 
                }
            )
            .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }))
            .setFooter({ 
                text: `Requested by ${message.author.tag}`, 
                iconURL: message.author.displayAvatarURL() 
            })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
