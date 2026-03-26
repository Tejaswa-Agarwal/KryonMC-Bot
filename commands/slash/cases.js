const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserCases } = require('../../utils/caseManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cases')
        .setDescription('View all moderation cases for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view cases for')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('active')
                .setDescription('Show only active cases (default: all cases)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.editReply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const activeOnly = interaction.options.getBoolean('active') || false;
        const cases = getUserCases(interaction.guild.id, user.id, activeOnly);

        if (cases.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('📋 User Cases')
                .setDescription(`${user} has no ${activeOnly ? 'active' : ''} cases.`)
                .setColor(0x2ECC71)
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
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
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
