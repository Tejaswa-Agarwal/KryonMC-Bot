const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCase } = require('../../utils/caseManager');
const EmbedTemplate = require('../../utils/embedTemplate');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete a number of messages from the channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only delete messages from this user (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for purging messages')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guild) {
            const embed = EmbedTemplate.error('Error', 'This command can only be used in a server.');
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            // Fetch messages
            let messages = await interaction.channel.messages.fetch({ limit: Math.min(amount + 1, 100) });
            
            // Filter by user if specified
            if (targetUser) {
                messages = messages.filter(msg => msg.author.id === targetUser.id);
            }

            // Remove the command invocation message
            messages = messages.filter(msg => msg.id !== interaction.id);

            // Bulk delete (only works for messages less than 14 days old)
            const deletedMessages = await interaction.channel.bulkDelete(messages, true);
            const deletedCount = deletedMessages.size;

            // Create case entry
            const caseId = createCase(
                interaction.guild.id,
                targetUser ? targetUser.id : 'multiple',
                'purge',
                interaction.user.id,
                interaction.user.tag,
                reason,
                { amount: deletedCount, channel: interaction.channel.name }
            );

            // Send success embed
            const embed = EmbedTemplate.success(
                'Messages Purged',
                `Successfully deleted **${deletedCount}** message${deletedCount !== 1 ? 's' : ''}`,
                [
                    { name: 'Channel', value: `${interaction.channel}`, inline: true },
                    { name: 'Moderator', value: `${interaction.user}`, inline: true },
                    { name: 'Case ID', value: `#${caseId}`, inline: true },
                    ...(targetUser ? [{ name: 'Target User', value: `${targetUser.tag}`, inline: true }] : []),
                    { name: 'Reason', value: reason }
                ]
            );

            await interaction.editReply({ embeds: [embed] });

            // Log to mod log if available
            const logger = require('../../utils/logger');
            const logConfig = logger.getLogConfig(interaction.guild.id);
            
            if (logConfig.modLog) {
                const logChannel = interaction.guild.channels.cache.get(logConfig.modLog);
                if (logChannel) {
                    const logEmbed = EmbedTemplate.modAction('purge', interaction.user, 
                        targetUser || { tag: `${deletedCount} messages`, id: 'N/A' }, 
                        reason, 
                        caseId
                    );
                    logEmbed.addFields({ name: 'Channel', value: `${interaction.channel}`, inline: true });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error deleting messages:', error);
            const embed = EmbedTemplate.error(
                'Failed to Purge Messages',
                error.message || 'Messages older than 14 days cannot be bulk deleted. Try a smaller amount.'
            );
            await interaction.editReply({ embeds: [embed] });
        }
    }
};
