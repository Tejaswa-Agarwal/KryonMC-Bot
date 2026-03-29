const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addCaseAppeal, reviewCaseAppeal } = require('../../utils/caseManager');
const { hasModeratorPermission } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('appeal')
        .setDescription('Case appeal management')
        .addSubcommand(sub =>
            sub.setName('submit')
                .setDescription('Submit appeal for a case')
                .addIntegerOption(option =>
                    option.setName('case-id')
                        .setDescription('Case number')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Appeal reason')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('review')
                .setDescription('Review case appeal')
                .addIntegerOption(option =>
                    option.setName('case-id')
                        .setDescription('Case number')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('decision')
                        .setDescription('Approve or reject appeal')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Approve', value: 'approve' },
                            { name: 'Reject', value: 'reject' }
                        ))
                .addStringOption(option =>
                    option.setName('note')
                        .setDescription('Review note')
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.editReply({ content: '❌ This command can only be used in a server.', ephemeral: true });
            return;
        }

        const sub = interaction.options.getSubcommand();
        const caseId = interaction.options.getInteger('case-id');

        if (sub === 'submit') {
            const reason = interaction.options.getString('reason');
            const ok = addCaseAppeal(interaction.guild.id, caseId, interaction.user.id, reason);
            if (!ok) {
                await interaction.editReply({ content: '❌ Case not found.', ephemeral: true });
                return;
            }
            await interaction.editReply({ content: `✅ Appeal submitted for case #${caseId}.` });
            return;
        }

        if (!hasModeratorPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
            await interaction.editReply({ content: '❌ Only moderators can review appeals.', ephemeral: true });
            return;
        }

        const decision = interaction.options.getString('decision');
        const note = interaction.options.getString('note') || '';
        const ok = reviewCaseAppeal(interaction.guild.id, caseId, interaction.user.id, decision === 'approve', note);
        if (!ok) {
            await interaction.editReply({ content: '❌ Appeal not found for this case.', ephemeral: true });
            return;
        }
        await interaction.editReply({ content: `✅ Appeal ${decision}d for case #${caseId}.` });
    }
};
