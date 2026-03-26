const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { removeCase } = require('../../utils/caseManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removecase')
        .setDescription('Remove a specific case from the system')
        .addIntegerOption(option =>
            option.setName('caseid')
                .setDescription('The case ID to remove')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.editReply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const caseId = interaction.options.getInteger('caseid');
        const removed = removeCase(interaction.guild.id, caseId);

        if (removed) {
            const embed = new EmbedBuilder()
                .setTitle('✅ Case Removed')
                .setDescription(`Successfully removed **Case #${caseId}** from the system.`)
                .setColor(0x2ECC71)
                .setFooter({ text: `Removed by ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply({ content: `❌ Case #${caseId} not found.`, ephemeral: true });
        }
    }
};
