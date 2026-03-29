const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getAutomodConfig, setAutomodConfig } = require('../../utils/automod');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configure automated moderation')
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enable automod'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable automod'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('antispam')
                .setDescription('Configure spam detection')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable spam detection')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('max-messages')
                        .setDescription('Max messages in time window (default: 5)')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('time-window')
                        .setDescription('Time window in seconds (default: 5)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('antiinvite')
                .setDescription('Configure invite link blocking')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable invite blocking')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('anticaps')
                .setDescription('Configure caps filter')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable caps filter')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('threshold')
                        .setDescription('Caps percentage threshold (default: 70)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('antimention')
                .setDescription('Configure mass mention protection')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable mass mention protection')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('max-mentions')
                        .setDescription('Max mentions allowed (default: 5)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('antiemoji')
                .setDescription('Configure emoji spam filter')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable emoji spam filter')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('max-emojis')
                        .setDescription('Max emojis allowed (default: 10)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('punishment')
                .setDescription('Set punishment for violations')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Punishment action')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Warn (delete + warning)', value: 'warn' },
                            { name: 'Timeout (5 minutes)', value: 'timeout' },
                            { name: 'Kick', value: 'kick' },
                            { name: 'Ban', value: 'ban' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist-channel')
                .setDescription('Whitelist a channel from automod')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to whitelist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist-role')
                .setDescription('Whitelist a role from automod')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to whitelist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('filter-add')
                .setDescription('Add a word to the filter')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('Word to filter')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('filter-remove')
                .setDescription('Remove a word from the filter')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('Word to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('regex-add')
                .setDescription('Add a regex filter pattern')
                .addStringOption(option =>
                    option.setName('pattern')
                        .setDescription('Regex pattern (without slashes)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('regex-remove')
                .setDescription('Remove a regex filter pattern')
                .addStringOption(option =>
                    option.setName('pattern')
                        .setDescription('Regex pattern to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('domain-add')
                .setDescription('Add blocked domain')
                .addStringOption(option =>
                    option.setName('domain')
                        .setDescription('Example: example.com')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('domain-remove')
                .setDescription('Remove blocked domain')
                .addStringOption(option =>
                    option.setName('domain')
                        .setDescription('Example: example.com')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bypass')
                .setDescription('Set bypass matrix for automod')
                .addBooleanOption(option =>
                    option.setName('admins')
                        .setDescription('Bypass for administrators')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('moderators')
                        .setDescription('Bypass for Manage Messages users')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('bots')
                        .setDescription('Bypass for bot users')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('View current automod configuration'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.editReply({ content: '❌ This command can only be used in a server.', ephemeral: true });
            return;
        }

        const { hasAdminPermission } = require('../../utils/permissions');
        if (!hasAdminPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
            await interaction.editReply({ content: '❌ Only admins can configure automod.', ephemeral: true });
            return;
        }

        const subcommand = interaction.options.getSubcommand();
        const config = getAutomodConfig(interaction.guild.id);

        if (subcommand === 'enable') {
            config.enabled = true;
            setAutomodConfig(interaction.guild.id, config);
            await interaction.editReply({ content: '✅ Automod has been **enabled**.' });
        } else if (subcommand === 'disable') {
            config.enabled = false;
            setAutomodConfig(interaction.guild.id, config);
            await interaction.editReply({ content: '✅ Automod has been **disabled**.' });
        } else if (subcommand === 'antispam') {
            const enabled = interaction.options.getBoolean('enabled');
            const maxMessages = interaction.options.getInteger('max-messages') || 5;
            const timeWindow = interaction.options.getInteger('time-window') || 5;

            config.antiSpam = {
                enabled,
                maxMessages,
                timeWindow: timeWindow * 1000
            };
            setAutomodConfig(interaction.guild.id, config);

            await interaction.editReply({ 
                content: `✅ Spam detection ${enabled ? 'enabled' : 'disabled'}${enabled ? `\nMax messages: ${maxMessages} in ${timeWindow}s` : ''}`
            });
        } else if (subcommand === 'antiinvite') {
            const enabled = interaction.options.getBoolean('enabled');

            if (!config.antiInvite) config.antiInvite = { whitelist: [] };
            config.antiInvite.enabled = enabled;
            setAutomodConfig(interaction.guild.id, config);

            await interaction.editReply({ content: `✅ Invite blocking ${enabled ? 'enabled' : 'disabled'}` });
        } else if (subcommand === 'anticaps') {
            const enabled = interaction.options.getBoolean('enabled');
            const threshold = interaction.options.getInteger('threshold') || 70;

            config.antiCaps = {
                enabled,
                threshold,
                minLength: 10
            };
            setAutomodConfig(interaction.guild.id, config);

            await interaction.editReply({ 
                content: `✅ Caps filter ${enabled ? 'enabled' : 'disabled'}${enabled ? `\nThreshold: ${threshold}%` : ''}`
            });
        } else if (subcommand === 'antimention') {
            const enabled = interaction.options.getBoolean('enabled');
            const maxMentions = interaction.options.getInteger('max-mentions') || 5;

            config.antiMassMention = {
                enabled,
                max: maxMentions
            };
            setAutomodConfig(interaction.guild.id, config);

            await interaction.editReply({ 
                content: `✅ Mass mention protection ${enabled ? 'enabled' : 'disabled'}${enabled ? `\nMax mentions: ${maxMentions}` : ''}`
            });
        } else if (subcommand === 'antiemoji') {
            const enabled = interaction.options.getBoolean('enabled');
            const maxEmojis = interaction.options.getInteger('max-emojis') || 10;

            config.antiEmoji = {
                enabled,
                max: maxEmojis
            };
            setAutomodConfig(interaction.guild.id, config);

            await interaction.editReply({ 
                content: `✅ Emoji spam filter ${enabled ? 'enabled' : 'disabled'}${enabled ? `\nMax emojis: ${maxEmojis}` : ''}`
            });
        } else if (subcommand === 'punishment') {
            const action = interaction.options.getString('action');

            config.punishment = action;
            setAutomodConfig(interaction.guild.id, config);

            const actions = {
                warn: 'Warn (delete + warning message)',
                timeout: 'Timeout (5 minutes)',
                kick: 'Kick from server',
                ban: 'Ban from server'
            };

            await interaction.editReply({ content: `✅ Punishment set to: **${actions[action]}**` });
        } else if (subcommand === 'whitelist-channel') {
            const channel = interaction.options.getChannel('channel');

            if (!config.whitelistedChannels) config.whitelistedChannels = [];
            
            if (config.whitelistedChannels.includes(channel.id)) {
                config.whitelistedChannels = config.whitelistedChannels.filter(id => id !== channel.id);
                setAutomodConfig(interaction.guild.id, config);
                await interaction.editReply({ content: `✅ Removed ${channel} from automod whitelist.` });
            } else {
                config.whitelistedChannels.push(channel.id);
                setAutomodConfig(interaction.guild.id, config);
                await interaction.editReply({ content: `✅ Added ${channel} to automod whitelist.` });
            }
        } else if (subcommand === 'whitelist-role') {
            const role = interaction.options.getRole('role');

            if (!config.whitelistedRoles) config.whitelistedRoles = [];
            
            if (config.whitelistedRoles.includes(role.id)) {
                config.whitelistedRoles = config.whitelistedRoles.filter(id => id !== role.id);
                setAutomodConfig(interaction.guild.id, config);
                await interaction.editReply({ content: `✅ Removed ${role} from automod whitelist.` });
            } else {
                config.whitelistedRoles.push(role.id);
                setAutomodConfig(interaction.guild.id, config);
                await interaction.editReply({ content: `✅ Added ${role} to automod whitelist.` });
            }
        } else if (subcommand === 'filter-add') {
            const word = interaction.options.getString('word');

            if (!config.customWords) config.customWords = [];
            
            if (!config.customWords.includes(word.toLowerCase())) {
                config.customWords.push(word.toLowerCase());
                setAutomodConfig(interaction.guild.id, config);
                await interaction.editReply({ content: `✅ Added "${word}" to word filter.` });
            } else {
                await interaction.editReply({ content: `⚠️ "${word}" is already in the filter.`, ephemeral: true });
            }
        } else if (subcommand === 'filter-remove') {
            const word = interaction.options.getString('word');

            if (!config.customWords) config.customWords = [];
            
            config.customWords = config.customWords.filter(w => w !== word.toLowerCase());
            setAutomodConfig(interaction.guild.id, config);
            await interaction.editReply({ content: `✅ Removed "${word}" from word filter.` });
        } else if (subcommand === 'regex-add') {
            const pattern = interaction.options.getString('pattern');
            try {
                new RegExp(pattern, 'i');
            } catch (_error) {
                await interaction.editReply({ content: '❌ Invalid regex pattern.', ephemeral: true });
                return;
            }

            if (!config.regexFilters) config.regexFilters = [];
            if (config.regexFilters.includes(pattern)) {
                await interaction.editReply({ content: '⚠️ Pattern already exists.', ephemeral: true });
                return;
            }
            config.regexFilters.push(pattern);
            setAutomodConfig(interaction.guild.id, config);
            await interaction.editReply({ content: `✅ Added regex filter: \`${pattern}\`` });
        } else if (subcommand === 'regex-remove') {
            const pattern = interaction.options.getString('pattern');
            if (!config.regexFilters) config.regexFilters = [];
            config.regexFilters = config.regexFilters.filter(p => p !== pattern);
            setAutomodConfig(interaction.guild.id, config);
            await interaction.editReply({ content: `✅ Removed regex filter: \`${pattern}\`` });
        } else if (subcommand === 'domain-add') {
            const domain = interaction.options.getString('domain').toLowerCase().trim();
            if (!config.blockedDomains) config.blockedDomains = [];
            if (!config.blockedDomains.includes(domain)) {
                config.blockedDomains.push(domain);
                setAutomodConfig(interaction.guild.id, config);
                await interaction.editReply({ content: `✅ Blocked domain added: \`${domain}\`` });
            } else {
                await interaction.editReply({ content: '⚠️ Domain already blocked.', ephemeral: true });
            }
        } else if (subcommand === 'domain-remove') {
            const domain = interaction.options.getString('domain').toLowerCase().trim();
            if (!config.blockedDomains) config.blockedDomains = [];
            config.blockedDomains = config.blockedDomains.filter(d => d !== domain);
            setAutomodConfig(interaction.guild.id, config);
            await interaction.editReply({ content: `✅ Removed blocked domain: \`${domain}\`` });
        } else if (subcommand === 'bypass') {
            const admins = interaction.options.getBoolean('admins');
            const moderators = interaction.options.getBoolean('moderators');
            const bots = interaction.options.getBoolean('bots');
            config.bypass = {
                admins: admins ?? config.bypass?.admins ?? true,
                moderators: moderators ?? config.bypass?.moderators ?? true,
                bots: bots ?? config.bypass?.bots ?? true
            };
            setAutomodConfig(interaction.guild.id, config);
            await interaction.editReply({ content: `✅ Bypass updated.\nAdmins: ${config.bypass.admins}\nModerators: ${config.bypass.moderators}\nBots: ${config.bypass.bots}` });
        } else if (subcommand === 'config') {
            let response = '**🤖 Automod Configuration**\n\n';
            response += `**Status:** ${config.enabled ? '✅ Enabled' : '❌ Disabled'}\n`;
            response += `**Punishment:** ${config.punishment || 'warn'}\n\n`;
            
            response += `**Filters:**\n`;
            response += `• Anti-Spam: ${config.antiSpam?.enabled ? '✅' : '❌'}${config.antiSpam?.enabled ? ` (${config.antiSpam.maxMessages} msgs/${config.antiSpam.timeWindow/1000}s)` : ''}\n`;
            response += `• Anti-Invite: ${config.antiInvite?.enabled ? '✅' : '❌'}\n`;
            response += `• Anti-Caps: ${config.antiCaps?.enabled ? '✅' : '❌'}${config.antiCaps?.enabled ? ` (${config.antiCaps.threshold}%)` : ''}\n`;
            response += `• Anti-Mass Mention: ${config.antiMassMention?.enabled ? '✅' : '❌'}${config.antiMassMention?.enabled ? ` (max ${config.antiMassMention.max})` : ''}\n`;
            response += `• Anti-Emoji Spam: ${config.antiEmoji?.enabled ? '✅' : '❌'}${config.antiEmoji?.enabled ? ` (max ${config.antiEmoji.max})` : ''}\n`;
            response += `• Custom Word Filter: ${config.customWords?.length || 0} words\n`;
            response += `• Regex Filters: ${config.regexFilters?.length || 0}\n`;
            response += `• Blocked Domains: ${config.blockedDomains?.length || 0}\n\n`;
            response += `**Bypass Matrix:** admins=${config.bypass?.admins !== false}, moderators=${config.bypass?.moderators !== false}, bots=${config.bypass?.bots !== false}\n\n`;
            
            if (config.whitelistedChannels && config.whitelistedChannels.length > 0) {
                response += `**Whitelisted Channels:** ${config.whitelistedChannels.length}\n`;
            }
            if (config.whitelistedRoles && config.whitelistedRoles.length > 0) {
                response += `**Whitelisted Roles:** ${config.whitelistedRoles.length}\n`;
            }

            await interaction.editReply({ content: response });
        }
    }
};
