const { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');

const HELP_MODULES = {
    moderation: {
        label: 'Moderation',
        emoji: '🛡️',
        description: 'Core moderation and enforcement commands.',
        commands: [
            'ban', 'unban', 'kick', 'timeout', 'warn', 'warnings',
            'removewarn', 'clearwarns', 'cases', 'removecase',
            'purge', 'slowmode', 'lock', 'unlock', 'setnick',
            'snipe', 'editsnipe', 'appeal'
        ]
    },
    security: {
        label: 'Security',
        emoji: '🔐',
        description: 'Anti-nuke, anti-raid, and account security.',
        commands: ['setuproles', 'antinuke', 'security', 'audit', 'extraowners']
    },
    tickets: {
        label: 'Tickets & Support',
        emoji: '🎫',
        description: 'Ticket workflow and support setup.',
        commands: ['ticket-setup', 'ticket']
    },
    automation: {
        label: 'Automation',
        emoji: '⚙️',
        description: 'Automated moderation and server systems.',
        commands: ['automod', 'welcomer', 'verify', 'reactionrole', 'starboard', 'tags']
    },
    utility: {
        label: 'Utility',
        emoji: '🧰',
        description: 'Useful info and helper commands.',
        commands: ['help', 'ping', 'avatar', 'userinfo', 'serverinfo', 'afk', 'notes', 'logs']
    },
    admin: {
        label: 'Admin',
        emoji: '🧠',
        description: 'Administrative and control commands.',
        commands: ['announce', 'command', 'logging', 'setbotname', 'setbotavatar', 'backup', 'ladder']
    },
    fun: {
        label: 'Fun',
        emoji: '🎮',
        description: 'Community and engagement commands.',
        commands: ['8ball', 'poll', 'suggest']
    },
    giveaway: {
        label: 'Giveaways',
        emoji: '🎉',
        description: 'Giveaway management commands.',
        commands: ['giveaway', 'giveaway-reroll']
    }
};

function formatCommands(commands) {
    return commands.map(cmd => `\`/${cmd}\` • \`k!${cmd}\``).join('\n');
}

function buildHelpOverviewEmbed(client) {
    return new EmbedBuilder()
        .setAuthor({ name: '📚 Axion Help Center', iconURL: client.user.displayAvatarURL() })
        .setColor(0x5865F2)
        .setTitle('Bot Modules')
        .setDescription('Pick a module from the dropdown to view the commands in that section.')
        .addFields(
            Object.values(HELP_MODULES).map(module => ({
                name: `${module.emoji} ${module.label}`,
                value: module.description,
                inline: true
            }))
        )
        .setFooter({ text: `${client.user.username} • Module Navigation` })
        .setTimestamp();
}

function buildHelpModuleEmbed(client, moduleKey) {
    const module = HELP_MODULES[moduleKey];
    if (!module) {
        return buildHelpOverviewEmbed(client);
    }

    return new EmbedBuilder()
        .setAuthor({ name: '📚 Axion Help Center', iconURL: client.user.displayAvatarURL() })
        .setColor(0x5865F2)
        .setTitle(`${module.emoji} ${module.label} Commands`)
        .setDescription(module.description)
        .addFields({
            name: 'Available Commands',
            value: formatCommands(module.commands)
        })
        .setFooter({ text: `${client.user.username} • ${module.label}` })
        .setTimestamp();
}

function buildHelpSelectRow(selectedModule = 'overview') {
    const menu = new StringSelectMenuBuilder()
        .setCustomId('help_module_select')
        .setPlaceholder('Select a help module')
        .addOptions([
            {
                label: 'Overview',
                value: 'overview',
                description: 'Show all modules',
                emoji: '📋',
                default: selectedModule === 'overview'
            },
            ...Object.entries(HELP_MODULES).map(([key, module]) => ({
                label: module.label,
                value: key,
                description: module.description.slice(0, 100),
                emoji: module.emoji,
                default: selectedModule === key
            }))
        ]);

    return new ActionRowBuilder().addComponents(menu);
}

module.exports = {
    buildHelpOverviewEmbed,
    buildHelpModuleEmbed,
    buildHelpSelectRow
};
