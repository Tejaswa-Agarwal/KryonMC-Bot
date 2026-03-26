const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendModLog } = require('../../utils/modLog');
const { createCase } = require('../../utils/caseManager');

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
            return interaction.editReply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
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

        const embed = new EmbedBuilder()
            .setTitle('⚠️ User Warned')
            .setColor(0xF39C12)
            .addFields(
                { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
                { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                { name: '📊 Total Warnings', value: `\`${warnCount}\``, inline: true },
                { name: '📝 Reason', value: reason, inline: false }
            )
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: `Warning ID: ${warning.id}` })
            .setTimestamp();

        // Create case entry
        const caseId = createCase(
            guildId,
            userId,
            'warn',
            interaction.user.id,
            interaction.user.tag,
            reason
        );

        // Add case ID to embed
        embed.setFooter({ text: `Warning ID: ${warning.id} | Case #${caseId}` });

        await interaction.editReply({ embeds: [embed] });

        // Send to mod log
        await sendModLog(interaction.guild, 'warn', interaction.user, user, reason, { '📊 Total Warnings': warnCount });

        try {
            await user.send({ embeds: [embed] });
        } catch (error) {
            console.log('Could not DM user about warning');
        }
    }
};