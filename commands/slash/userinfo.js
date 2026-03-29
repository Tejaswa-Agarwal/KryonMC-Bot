const { SlashCommandBuilder } = require('discord.js');
const EmbedTemplate = require('../../utils/embedTemplate');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display user information')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get information about')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.guild) {
            const embed = EmbedTemplate.error('Error', 'This command can only be used in a server.');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);
        
        const embed = EmbedTemplate.userInfo(member);
        await interaction.editReply({ embeds: [embed] });
    }
};
