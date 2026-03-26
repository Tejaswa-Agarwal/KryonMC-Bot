const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setnick')
        .setDescription('Change a user\'s nickname')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to change nickname for')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('nickname')
                .setDescription('The new nickname (leave empty to reset)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.editReply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const nickname = interaction.options.getString('nickname');

        try {
            const member = await interaction.guild.members.fetch(user.id);
            await member.setNickname(nickname);

            if (nickname) {
                await interaction.editReply(`✅ Changed ${user}'s nickname to **${nickname}**`);
            } else {
                await interaction.editReply(`✅ Reset ${user}'s nickname`);
            }
        } catch (error) {
            console.error('Error setting nickname:', error);
            await interaction.editReply({ content: '❌ Failed to change nickname. Make sure I have permission and the user is in the server.', ephemeral: true });
        }
    }
};