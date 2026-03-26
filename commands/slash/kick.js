const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendModLog } = require('../../utils/modLog');
const { createCase } = require('../../utils/caseManager');

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
            await interaction.editReply({ content: 'This command can only be used in a server.', ephemeral: true });
            return;
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            const member = await interaction.guild.members.fetch(user.id);
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
            
            await interaction.editReply({ content: `✅ Kicked **${user.tag}** (${user.id})\nReason: ${reason}\n📋 Case #${caseId}` });
            
            // Send to mod log
            await sendModLog(interaction.guild, 'kick', interaction.user, user, reason);
        } catch (error) {
            console.error('Error kicking user:', error);
            await interaction.editReply({ content: 'Failed to kick user. Make sure I have the Kick Members permission.', ephemeral: true });
        }
    }
};
