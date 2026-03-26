const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendModLog } = require('../../utils/modLog');
const { createCase } = require('../../utils/caseManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user in the Discord server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 10m, 1h, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.editReply({ content: 'This command can only be used in a server.', ephemeral: true });
            return;
        }

        const user = interaction.options.getUser('user');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Parse duration (e.g., 10m, 1h, 1d)
        let timeoutDuration;
        try {
            timeoutDuration = parseDuration(duration);
            if (!timeoutDuration || timeoutDuration < 1000 || timeoutDuration > 28 * 24 * 60 * 60 * 1000) {
                await interaction.editReply({ content: 'Invalid duration. Must be between 1 second and 28 days. Examples: 10s, 5m, 1h, 1d', ephemeral: true });
                return;
            }
        } catch (error) {
            await interaction.editReply({ content: 'Invalid duration format. Examples: 10s, 5m, 1h, 1d', ephemeral: true });
            return;
        }

        try {
            const member = await interaction.guild.members.fetch(user.id);
            await member.timeout(timeoutDuration, `${reason} | Timed out by ${interaction.user.tag}`);
            
            const durationStr = formatDuration(timeoutDuration);
            
            // Create case entry
            const caseId = createCase(
                interaction.guild.id,
                user.id,
                'timeout',
                interaction.user.id,
                interaction.user.tag,
                reason,
                { duration: durationStr }
            );
            
            await interaction.editReply({ content: `✅ Timed out **${user.tag}** for ${durationStr}\nReason: ${reason}\n📋 Case #${caseId}` });
            
            // Send to mod log
            await sendModLog(interaction.guild, 'timeout', interaction.user, user, reason, { '⏱️ Duration': durationStr });
        } catch (error) {
            console.error('Error timing out user:', error);
            await interaction.editReply({ content: 'Failed to timeout user. Make sure I have the Moderate Members permission.', ephemeral: true });
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
