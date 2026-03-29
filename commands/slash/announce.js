const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedTemplate = require('../../utils/embedTemplate');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Send an announcement to a channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send the announcement to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The announcement message')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Custom announcement title (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Embed color')
                .setRequired(false)
                .addChoices(
                    { name: 'Blue', value: '#0099FF' },
                    { name: 'Green', value: '#00FF00' },
                    { name: 'Red', value: '#FF0000' },
                    { name: 'Gold', value: '#FFD700' },
                    { name: 'Purple', value: '#9B59B6' }
                ))
        .addBooleanOption(option =>
            option.setName('ping-everyone')
                .setDescription('Ping @everyone (use with caution)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (!interaction.guild) {
            const embed = EmbedTemplate.error('Error', 'This command can only be used in a server.');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        const channel = interaction.options.getChannel('channel');
        const announcement = interaction.options.getString('message');
        const title = interaction.options.getString('title') || '📢 Announcement';
        const color = interaction.options.getString('color') || '#FFD700';
        const pingEveryone = interaction.options.getBoolean('ping-everyone') || false;

        if (!channel.isTextBased()) {
            const embed = EmbedTemplate.error('Invalid Channel', 'Please select a text channel.');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        try {
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(announcement)
                .setColor(color)
                .setFooter({ text: `Announced by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            if (interaction.guild.iconURL()) {
                embed.setThumbnail(interaction.guild.iconURL());
            }

            const content = pingEveryone ? '@everyone' : null;
            await channel.send({ content, embeds: [embed] });
            
            const successEmbed = EmbedTemplate.success(
                'Announcement Sent',
                `Your announcement has been sent to ${channel}`,
                [
                    { name: 'Title', value: title, inline: true },
                    { name: 'Channel', value: `${channel}`, inline: true },
                    { name: 'Pinged Everyone', value: pingEveryone ? 'Yes' : 'No', inline: true }
                ]
            );
            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error sending announcement:', error);
            const embed = EmbedTemplate.error(
                'Failed to Send Announcement',
                'Make sure I have permission to send messages in that channel.'
            );
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
    }
};
