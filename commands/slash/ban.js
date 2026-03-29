const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendModLog } = require('../../utils/modLog');
const { createCase } = require('../../utils/caseManager');
const EmbedTemplate = require('../../utils/embedTemplate');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the Discord server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('delete-days')
                .setDescription('Days of messages to delete (0-7)')
                .setRequired(false)
                .addChoices(
                    { name: 'None', value: 0 },
                    { name: '1 day', value: 1 },
                    { name: '3 days', value: 3 },
                    { name: '7 days', value: 7 }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        if (!interaction.guild) {
            const embed = EmbedTemplate.error('Error', 'This command can only be used in a server.');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteDays = interaction.options.getInteger('delete-days') || 0;

        // Check if trying to ban self
        if (user.id === interaction.user.id) {
            const embed = EmbedTemplate.error('Cannot Ban Self', 'You cannot ban yourself!');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        // Check if trying to ban bot
        if (user.id === interaction.client.user.id) {
            const embed = EmbedTemplate.error('Cannot Ban Bot', 'You cannot ban me!');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        try {
            // Try to fetch member to check permissions
            const targetMember = await interaction.guild.members.fetch(user.id).catch(() => null);
            
            if (targetMember) {
                // Check if target is higher in role hierarchy
                if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                    const embed = EmbedTemplate.error('Insufficient Permissions', 'You cannot ban someone with a higher or equal role.');
                    await interaction.editReply({ embeds: [embed], ephemeral: true });
                    return;
                }

                // Check if bot can ban this user
                const botMember = await interaction.guild.members.fetchMe();
                if (targetMember.roles.highest.position >= botMember.roles.highest.position) {
                    const embed = EmbedTemplate.error('Cannot Ban User', 'I cannot ban someone with a higher or equal role than me.');
                    await interaction.editReply({ embeds: [embed], ephemeral: true });
                    return;
                }
            }

            // Try to DM user before banning
            try {
                const dmEmbed = EmbedTemplate.warning(
                    'You have been banned',
                    `**Server:** ${interaction.guild.name}\n**Reason:** ${reason}\n**Banned by:** ${interaction.user.tag}`
                );
                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                // User has DMs disabled, continue anyway
            }

            // Ban the user
            await interaction.guild.members.ban(user.id, { 
                reason: `${reason} | Banned by ${interaction.user.tag}`,
                deleteMessageSeconds: deleteDays * 24 * 60 * 60
            });
            
            // Create case entry
            const caseId = createCase(
                interaction.guild.id,
                user.id,
                'ban',
                interaction.user.id,
                interaction.user.tag,
                reason
            );
            
            // Send success embed
            const embed = EmbedTemplate.modAction('ban', interaction.user, user, reason, caseId);
            if (deleteDays > 0) {
                embed.addFields({ name: 'Messages Deleted', value: `${deleteDays} day(s)`, inline: true });
            }
            
            await interaction.editReply({ embeds: [embed] });
            
            // Send to mod log
            await sendModLog(interaction.guild, 'ban', interaction.user, user, reason);
        } catch (error) {
            console.error('Error banning user:', error);
            const embed = EmbedTemplate.error(
                'Failed to Ban User',
                'Make sure I have the **Ban Members** permission and my role is above the target user.'
            );
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
    }
};
