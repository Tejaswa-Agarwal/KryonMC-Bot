const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendModLog } = require('../../utils/modLog');
const { createCase } = require('../../utils/caseManager');
const EmbedTemplate = require('../../utils/embedTemplate');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the Discord server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        if (!interaction.guild) {
            const embed = EmbedTemplate.error('Error', 'This command can only be used in a server.');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if trying to kick self
        if (user.id === interaction.user.id) {
            const embed = EmbedTemplate.error('Cannot Kick Self', 'You cannot kick yourself!');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        // Check if trying to kick bot
        if (user.id === interaction.client.user.id) {
            const embed = EmbedTemplate.error('Cannot Kick Bot', 'You cannot kick me!');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        try {
            const member = await interaction.guild.members.fetch(user.id);

            // Check role hierarchy
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                const embed = EmbedTemplate.error('Insufficient Permissions', 'You cannot kick someone with a higher or equal role.');
                await interaction.editReply({ embeds: [embed], ephemeral: true });
                return;
            }

            const botMember = await interaction.guild.members.fetchMe();
            if (member.roles.highest.position >= botMember.roles.highest.position) {
                const embed = EmbedTemplate.error('Cannot Kick User', 'I cannot kick someone with a higher or equal role than me.');
                await interaction.editReply({ embeds: [embed], ephemeral: true });
                return;
            }

            // Try to DM user before kicking
            try {
                const dmEmbed = EmbedTemplate.warning(
                    'You have been kicked',
                    `**Server:** ${interaction.guild.name}\n**Reason:** ${reason}\n**Kicked by:** ${interaction.user.tag}`
                );
                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                // User has DMs disabled
            }

            // Kick the user
            await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);
            
            // Create case entry
            const caseId = createCase(
                interaction.guild.id,
                user.id,
                'kick',
                interaction.user.id,
                interaction.user.tag,
                reason
            );
            
            // Send success embed
            const embed = EmbedTemplate.modAction('kick', interaction.user, user, reason, caseId);
            await interaction.editReply({ embeds: [embed] });
            
            // Send to mod log
            await sendModLog(interaction.guild, 'kick', interaction.user, user, reason);
        } catch (error) {
            console.error('Error kicking user:', error);
            const embed = EmbedTemplate.error(
                'Failed to Kick User',
                error.message || 'Make sure I have the **Kick Members** permission and my role is above the target user.'
            );
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
    }
};
