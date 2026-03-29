const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendModLog } = require('../../utils/modLog');
const { createCase } = require('../../utils/caseManager');
const EmbedTemplate = require('../../utils/embedTemplate');

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
            const embed = EmbedTemplate.error('Error', 'This command can only be used in a server.');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        const user = interaction.options.getUser('user');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if trying to timeout self
        if (user.id === interaction.user.id) {
            const embed = EmbedTemplate.error('Cannot Timeout Self', 'You cannot timeout yourself!');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        // Parse duration (e.g., 10m, 1h, 1d)
        let timeoutDuration;
        try {
            timeoutDuration = parseDuration(duration);
            if (!timeoutDuration || timeoutDuration < 1000 || timeoutDuration > 28 * 24 * 60 * 60 * 1000) {
                const embed = EmbedTemplate.error(
                    'Invalid Duration',
                    'Duration must be between 1 second and 28 days.\n\n**Examples:** `10s`, `5m`, `1h`, `1d`'
                );
                await interaction.editReply({ embeds: [embed], ephemeral: true });
                return;
            }
        } catch (error) {
            const embed = EmbedTemplate.error(
                'Invalid Duration Format',
                '**Examples:** `10s`, `5m`, `1h`, `1d`'
            );
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        try {
            const member = await interaction.guild.members.fetch(user.id);

            // Check role hierarchy
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                const embed = EmbedTemplate.error('Insufficient Permissions', 'You cannot timeout someone with a higher or equal role.');
                await interaction.editReply({ embeds: [embed], ephemeral: true });
                return;
            }

            const botMember = await interaction.guild.members.fetchMe();
            if (member.roles.highest.position >= botMember.roles.highest.position) {
                const embed = EmbedTemplate.error('Cannot Timeout User', 'I cannot timeout someone with a higher or equal role than me.');
                await interaction.editReply({ embeds: [embed], ephemeral: true });
                return;
            }

            // Try to DM user
            try {
                const durationStr = formatDuration(timeoutDuration);
                const dmEmbed = EmbedTemplate.warning(
                    'You have been timed out',
                    `**Server:** ${interaction.guild.name}\n**Duration:** ${durationStr}\n**Reason:** ${reason}\n**By:** ${interaction.user.tag}`
                );
                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                // User has DMs disabled
            }

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
            
            // Send success embed
            const embed = EmbedTemplate.modAction('timeout', interaction.user, user, reason, caseId);
            embed.addFields({ name: '⏱️ Duration', value: durationStr, inline: true });
            
            await interaction.editReply({ embeds: [embed] });
            
            // Send to mod log
            await sendModLog(interaction.guild, 'timeout', interaction.user, user, reason, { '⏱️ Duration': durationStr });
        } catch (error) {
            console.error('Error timing out user:', error);
            const embed = EmbedTemplate.error(
                'Failed to Timeout User',
                'Make sure I have the **Moderate Members** permission and my role is above the target user.'
            );
            await interaction.editReply({ embeds: [embed], ephemeral: true });
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
