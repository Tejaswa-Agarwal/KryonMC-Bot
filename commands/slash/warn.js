const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendModLog } = require('../../utils/modLog');
const { createCase } = require('../../utils/caseManager');
const EmbedTemplate = require('../../utils/embedTemplate');

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
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        if (!interaction.guild) {
            const embed = EmbedTemplate.error('Error', 'This command can only be used in a server.');
            return interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        // Check if trying to warn self
        if (user.id === interaction.user.id) {
            const embed = EmbedTemplate.error('Cannot Warn Self', 'You cannot warn yourself!');
            return interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        // Check if trying to warn bot
        if (user.id === interaction.client.user.id) {
            const embed = EmbedTemplate.error('Cannot Warn Bot', 'You cannot warn me!');
            return interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        const warnings = loadWarnings();

        const guildId = interaction.guild.id;
        const userId = user.id;

        if (!warnings[guildId]) warnings[guildId] = {};
        if (!warnings[guildId][userId]) warnings[guildId][userId] = [];

        const warning = {
            id: Date.now(),
            reason,
            moderator: interaction.user.tag,
            moderatorId: interaction.user.id,
            timestamp: Date.now()
        };

        warnings[guildId][userId].push(warning);
        saveWarnings(warnings);

        const warnCount = warnings[guildId][userId].length;

        // Create case entry
        const caseId = createCase(
            guildId,
            userId,
            'warn',
            interaction.user.id,
            interaction.user.tag,
            reason
        );

        // Send success embed
        const embed = EmbedTemplate.modAction('warn', interaction.user, user, reason, caseId);
        embed.addFields(
            { name: '⚠️ Total Warnings', value: `${warnCount}`, inline: true },
            { name: '🆔 Warning ID', value: `\`${warning.id}\``, inline: true }
        );

        await interaction.editReply({ embeds: [embed] });

        // Try to DM user
        try {
            const dmEmbed = EmbedTemplate.warning(
                'You have been warned',
                `**Server:** ${interaction.guild.name}\n**Reason:** ${reason}\n**Warned by:** ${interaction.user.tag}\n\n**Total Warnings:** ${warnCount}`
            );
            await user.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.log('Could not DM user about warning');
        }

        // Send to mod log
        await sendModLog(interaction.guild, 'warn', interaction.user, user, reason, { '📊 Total Warnings': warnCount });
    }
};
