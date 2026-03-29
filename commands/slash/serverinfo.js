const { SlashCommandBuilder } = require('discord.js');
const EmbedTemplate = require('../../utils/embedTemplate');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display server information'),
    async execute(interaction) {
        if (!interaction.guild) {
            const embed = EmbedTemplate.error('Error', 'This command can only be used in a server.');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        const embed = EmbedTemplate.serverInfo(interaction.guild);
        await interaction.editReply({ embeds: [embed] });
    }
};
