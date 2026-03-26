const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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
        .setName('removewarn')
        .setDescription('Remove a specific warning from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove warning from')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('warnid')
                .setDescription('The warning ID to remove')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.editReply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const warnId = interaction.options.getInteger('warnid');
        const warnings = loadWarnings();

        const guildId = interaction.guild.id;
        const userId = user.id;

        if (!warnings[guildId] || !warnings[guildId][userId] || warnings[guildId][userId].length === 0) {
            return interaction.editReply({ content: `${user} has no warnings.`, ephemeral: true });
        }

        const warnIndex = warnings[guildId][userId].findIndex(w => w.id === warnId);

        if (warnIndex === -1) {
            return interaction.editReply({ content: `❌ Warning ID ${warnId} not found for ${user}.`, ephemeral: true });
        }

        const removedWarn = warnings[guildId][userId].splice(warnIndex, 1)[0];
        saveWarnings(warnings);

        const remainingWarns = warnings[guildId][userId].length;

        const embed = new EmbedBuilder()
            .setTitle('✅ Warning Removed')
            .setColor(0x2ECC71)
            .addFields(
                { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
                { name: '👮 Removed By', value: interaction.user.tag, inline: true },
                { name: '📊 Remaining Warnings', value: `\`${remainingWarns}\``, inline: true },
                { name: '📝 Removed Warning', value: removedWarn.reason, inline: false },
                { name: '🆔 Warning ID', value: `\`${warnId}\``, inline: true }
            )
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: `Action by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        try {
            await user.send({ embeds: [
                new EmbedBuilder()
                    .setTitle('✅ Warning Removed')
                    .setDescription(`A warning has been removed from your record in **${interaction.guild.name}**`)
                    .setColor(0x2ECC71)
                    .addFields(
                        { name: '📝 Warning Removed', value: removedWarn.reason },
                        { name: '📊 Remaining Warnings', value: `\`${remainingWarns}\`` }
                    )
                    .setTimestamp()
            ]});
        } catch (error) {
            console.log('Could not DM user about warning removal');
        }
    }
};
