const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const EmbedTemplate = require('../../utils/embedTemplate');
const { createSuggestion, updateSuggestionStatus, getSuggestionConfig } = require('../../utils/suggestions');
const { hasAdminPermission } = require('../../utils/permissions');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'data', 'config.json');

function getConfig() {
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return {};
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Suggestion system commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Submit a suggestion')
                .addStringOption(option =>
                    option.setName('suggestion')
                        .setDescription('Your suggestion')
                        .setRequired(true)
                        .setMaxLength(1000)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the suggestion system')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for suggestions')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('approve')
                .setDescription('Approve a suggestion')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('Suggestion ID')
                        .setRequired(true)
                        .setMinValue(1))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for approval')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('deny')
                .setDescription('Deny a suggestion')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('Suggestion ID')
                        .setRequired(true)
                        .setMinValue(1))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for denial')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable the suggestion system')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const suggestion = interaction.options.getString('suggestion');
            
            const result = await createSuggestion(interaction, suggestion);

            if (result.success) {
                const embed = EmbedTemplate.success(
                    'Suggestion Submitted',
                    `Your suggestion (#${result.suggestionNumber}) has been posted!\n\n[View Suggestion](${result.messageUrl})`
                );
                await interaction.editReply({ embeds: [embed], ephemeral: true });
            } else {
                const embed = EmbedTemplate.error('Submission Failed', result.message);
                await interaction.editReply({ embeds: [embed], ephemeral: true });
            }

        } else if (subcommand === 'setup') {
            if (!hasAdminPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                const embed = EmbedTemplate.error('No Permission', 'You need Administrator permission.');
                await interaction.editReply({ embeds: [embed], ephemeral: true });
                return;
            }

            const channel = interaction.options.getChannel('channel');
            const config = getConfig();

            if (!config[interaction.guild.id]) config[interaction.guild.id] = {};
            config[interaction.guild.id].suggestionConfig = {
                enabled: true,
                channelId: channel.id,
                counter: 0,
                suggestions: {}
            };

            saveConfig(config);

            const embed = EmbedTemplate.success(
                'Suggestion System Setup',
                `**Channel:** ${channel}\n\nUsers can now submit suggestions with \`/suggest create\`!`
            );
            await interaction.editReply({ embeds: [embed] });

        } else if (subcommand === 'approve' || subcommand === 'deny') {
            if (!hasAdminPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                const embed = EmbedTemplate.error('No Permission', 'You need Administrator permission.');
                await interaction.editReply({ embeds: [embed], ephemeral: true });
                return;
            }

            const suggestionId = interaction.options.getInteger('id');
            const reason = interaction.options.getString('reason');
            const status = subcommand === 'approve' ? 'approved' : 'denied';

            const result = await updateSuggestionStatus(interaction.guild, suggestionId, status, reason);

            if (result.success) {
                const embed = EmbedTemplate.success(
                    `Suggestion ${status === 'approved' ? 'Approved' : 'Denied'}`,
                    `Suggestion #${suggestionId} has been ${status}.${reason ? `\n**Reason:** ${reason}` : ''}`
                );
                await interaction.editReply({ embeds: [embed] });
            } else {
                const embed = EmbedTemplate.error('Update Failed', 'Could not find or update suggestion.');
                await interaction.editReply({ embeds: [embed], ephemeral: true });
            }

        } else if (subcommand === 'disable') {
            if (!hasAdminPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                const embed = EmbedTemplate.error('No Permission', 'You need Administrator permission.');
                await interaction.editReply({ embeds: [embed], ephemeral: true });
                return;
            }

            const config = getConfig();
            if (config[interaction.guild.id]?.suggestionConfig) {
                config[interaction.guild.id].suggestionConfig.enabled = false;
                saveConfig(config);
            }

            const embed = EmbedTemplate.success('Suggestions Disabled', 'The suggestion system has been disabled.');
            await interaction.editReply({ embeds: [embed] });
        }
    }
};
