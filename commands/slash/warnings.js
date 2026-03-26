const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsFile = path.join(__dirname, '..', '..', 'data', 'warnings.json');

function loadWarnings() {
    if (fs.existsSync(warningsFile)) {
        return JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
    }
    return {};
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check warnings for')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.editReply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const user = interaction.options.getUser('user') || interaction.user;
        const warnings = loadWarnings();

        const guildId = interaction.guild.id;
        const userId = user.id;

        const userWarnings = warnings[guildId]?.[userId] || [];

        if (userWarnings.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('⚠️ User Warnings')
                .setDescription(`${user} has no warnings! 🎉`)
                .setColor(0x2ECC71)
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        const warningsList = userWarnings.map((w, index) => {
            return `**${index + 1}.** ${w.reason}\n📅 <t:${Math.floor(w.timestamp / 1000)}:R> by ${w.moderator}\n🆔 ID: \`${w.id}\``;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setTitle('⚠️ User Warnings')
            .setDescription(`**User:** ${user.tag}\n**Total Warnings:** ${userWarnings.length}\n\n${warningsList}`)
            .setColor(0xE74C3C)
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};