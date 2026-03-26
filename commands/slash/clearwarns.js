const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsFile = path.join(__dirname, '..', '..', 'data', 'warnings.json');

function loadWarnings() {
    if (fs.existsSync(warningsFile)) {
        return JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
    }
    return {};
}

function saveWarnings(warnings) {
    fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Clear all warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to clear warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.editReply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const warnings = loadWarnings();

        const guildId = interaction.guild.id;
        const userId = user.id;

        const warnCount = warnings[guildId]?.[userId]?.length || 0;

        if (warnCount === 0) {
            return interaction.editReply({ content: `${user} has no warnings to clear.`, ephemeral: true });
        }

        if (warnings[guildId] && warnings[guildId][userId]) {
            delete warnings[guildId][userId];
            saveWarnings(warnings);
        }

        await interaction.editReply(`✅ Cleared **${warnCount}** warning(s) for ${user}`);
    }
};