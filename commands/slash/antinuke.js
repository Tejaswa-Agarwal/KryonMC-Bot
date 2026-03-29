const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedTemplate = require('../../utils/embedTemplate');
const { hasAdminPermission } = require('../../utils/permissions');
const { getAntiNukeConfig, setAntiNukeConfig } = require('../../utils/antiNuke');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antinuke')
        .setDescription('Configure anti-nuke protection')
        .addSubcommand(sub =>
            sub.setName('enable')
                .setDescription('Enable anti-nuke'))
        .addSubcommand(sub =>
            sub.setName('disable')
                .setDescription('Disable anti-nuke'))
        .addSubcommand(sub =>
            sub.setName('config')
                .setDescription('View anti-nuke config'))
        .addSubcommand(sub =>
            sub.setName('preset')
                .setDescription('Apply anti-nuke preset profile')
                .addStringOption(option =>
                    option.setName('level')
                        .setDescription('Preset level')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Strict', value: 'strict' },
                            { name: 'Medium', value: 'medium' },
                            { name: 'Custom', value: 'custom' }
                        )))
        .addSubcommand(sub =>
            sub.setName('settings')
                .setDescription('Update anti-nuke behavior')
                .addIntegerOption(option =>
                    option.setName('threshold')
                        .setDescription('Actions allowed before trigger')
                        .setRequired(false)
                        .setMinValue(2)
                        .setMaxValue(20))
                .addIntegerOption(option =>
                    option.setName('interval-seconds')
                        .setDescription('Detection window in seconds')
                        .setRequired(false)
                        .setMinValue(5)
                        .setMaxValue(120))
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Response action')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Remove Roles', value: 'remove_roles' },
                            { name: 'Kick', value: 'kick' },
                            { name: 'Ban', value: 'ban' }
                        ))
                .addBooleanOption(option =>
                    option.setName('apply-to-admins')
                        .setDescription('Apply anti-nuke to administrators')
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('whitelist-user')
                .setDescription('Add/remove user from anti-nuke whitelist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to toggle')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('whitelist-role')
                .setDescription('Add/remove role from anti-nuke whitelist')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to toggle')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.editReply({ embeds: [EmbedTemplate.error('Server Only', 'This command can only be used in a server.')], ephemeral: true });
            return;
        }

        if (!hasAdminPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
            await interaction.editReply({ embeds: [EmbedTemplate.error('No Permission', 'Only admins can configure anti-nuke.')], ephemeral: true });
            return;
        }

        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const config = getAntiNukeConfig(guildId);

        if (sub === 'enable') {
            setAntiNukeConfig(guildId, { ...config, enabled: true });
            await interaction.editReply({ embeds: [EmbedTemplate.success('Anti-Nuke Enabled', 'Protection is now active.')] });
            return;
        }

        if (sub === 'disable') {
            setAntiNukeConfig(guildId, { ...config, enabled: false });
            await interaction.editReply({ embeds: [EmbedTemplate.warning('Anti-Nuke Disabled', 'Protection has been disabled.')] });
            return;
        }

        if (sub === 'settings') {
            const threshold = interaction.options.getInteger('threshold');
            const intervalSeconds = interaction.options.getInteger('interval-seconds');
            const action = interaction.options.getString('action');
            const applyToAdmins = interaction.options.getBoolean('apply-to-admins');

            setAntiNukeConfig(guildId, {
                ...config,
                threshold: threshold ?? config.threshold,
                intervalMs: intervalSeconds ? intervalSeconds * 1000 : config.intervalMs,
                action: action ?? config.action,
                applyToAdmins: applyToAdmins ?? config.applyToAdmins,
            });

            const next = getAntiNukeConfig(guildId);
            await interaction.editReply({
                embeds: [EmbedTemplate.success(
                    'Anti-Nuke Updated',
                        `**Threshold:** ${next.threshold}\n**Window:** ${Math.round(next.intervalMs / 1000)}s\n**Action:** ${next.action}`
                    )],
            });
            return;
        }

        if (sub === 'preset') {
            const level = interaction.options.getString('level');
            const presets = {
                strict: { preset: 'strict', threshold: 2, intervalMs: 8000, action: 'ban', applyToAdmins: true },
                medium: { preset: 'medium', threshold: 3, intervalMs: 10000, action: 'kick', applyToAdmins: false },
                custom: { preset: 'custom' }
            };

            const selected = presets[level];
            setAntiNukeConfig(guildId, {
                ...config,
                ...(selected || {}),
            });
            const next = getAntiNukeConfig(guildId);
            await interaction.editReply({
                embeds: [EmbedTemplate.success(
                    'Anti-Nuke Preset Applied',
                    `**Preset:** ${next.preset || 'custom'}\n**Threshold:** ${next.threshold}\n**Window:** ${Math.round(next.intervalMs / 1000)}s\n**Action:** ${next.action}\n**Apply to admins:** ${next.applyToAdmins ? 'yes' : 'no'}`
                )]
            });
            return;
        }

        if (sub === 'whitelist-user') {
            const user = interaction.options.getUser('user');
            const users = config.whitelistedUsers || [];
            const updated = users.includes(user.id)
                ? users.filter(id => id !== user.id)
                : [...users, user.id];
            setAntiNukeConfig(guildId, { ...config, whitelistedUsers: updated });
            await interaction.editReply({
                embeds: [EmbedTemplate.success('Whitelist Updated', `${updated.includes(user.id) ? 'Added' : 'Removed'} ${user.tag} ${updated.includes(user.id) ? 'to' : 'from'} anti-nuke whitelist.`)],
            });
            return;
        }

        if (sub === 'whitelist-role') {
            const role = interaction.options.getRole('role');
            const roles = config.whitelistedRoles || [];
            const updated = roles.includes(role.id)
                ? roles.filter(id => id !== role.id)
                : [...roles, role.id];
            setAntiNukeConfig(guildId, { ...config, whitelistedRoles: updated });
            await interaction.editReply({
                embeds: [EmbedTemplate.success('Whitelist Updated', `${updated.includes(role.id) ? 'Added' : 'Removed'} ${role} ${updated.includes(role.id) ? 'to' : 'from'} anti-nuke whitelist.`)],
            });
            return;
        }

        await interaction.editReply({
            embeds: [EmbedTemplate.info(
                'Anti-Nuke Configuration',
                `**Status:** ${config.enabled ? 'Enabled' : 'Disabled'}\n**Preset:** ${config.preset || 'custom'}\n**Threshold:** ${config.threshold}\n**Window:** ${Math.round(config.intervalMs / 1000)}s\n**Action:** ${config.action}\n**Apply to admins:** ${config.applyToAdmins ? 'yes' : 'no'}\n**Whitelisted Users:** ${(config.whitelistedUsers || []).length}\n**Whitelisted Roles:** ${(config.whitelistedRoles || []).length}`
            )],
        });
    },
};
