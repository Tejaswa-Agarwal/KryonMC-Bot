const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getPunishmentLadder, setPunishmentLadder } = require('../../utils/caseManager');
const { hasAdminPermission } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ladder')
        .setDescription('Configure punishment ladder')
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View current punishment ladder'))
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('Set punishment ladder order')
                .addStringOption(option =>
                    option.setName('steps')
                        .setDescription('Comma separated, e.g. warn,timeout,kick,ban')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.editReply({ content: '❌ This command can only be used in a server.', ephemeral: true });
            return;
        }

        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'view') {
            const steps = getPunishmentLadder(guildId);
            await interaction.editReply({ content: `**Punishment Ladder**\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}` });
            return;
        }

        if (!hasAdminPermission(interaction.member, guildId, interaction.user.id, interaction.guild.ownerId)) {
            await interaction.editReply({ content: '❌ Only admins can update ladder.', ephemeral: true });
            return;
        }

        const raw = interaction.options.getString('steps');
        const steps = raw.split(',').map(s => s.trim()).filter(Boolean);
        const updated = setPunishmentLadder(guildId, steps);
        await interaction.editReply({ content: `✅ Updated ladder: ${updated.join(' → ')}` });
    }
};
