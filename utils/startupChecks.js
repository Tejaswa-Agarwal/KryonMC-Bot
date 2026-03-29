const configStore = require('../configStore');

function runStartupChecks(client) {
    try {
        const roleConfig = configStore.get('roleConfig') || {};
        const automodConfig = configStore.get('automodConfig') || {};
        const issues = [];

        for (const guild of client.guilds.cache.values()) {
            const roles = roleConfig[guild.id] || {};
            if (roles.moderatorRoleId && !guild.roles.cache.has(roles.moderatorRoleId)) {
                issues.push(`[${guild.name}] Missing moderator role: ${roles.moderatorRoleId}`);
            }
            if (roles.adminRoleId && !guild.roles.cache.has(roles.adminRoleId)) {
                issues.push(`[${guild.name}] Missing admin role: ${roles.adminRoleId}`);
            }

            const auto = automodConfig[guild.id] || {};
            if (Array.isArray(auto.whitelistedChannels)) {
                for (const channelId of auto.whitelistedChannels) {
                    if (!guild.channels.cache.has(channelId)) {
                        issues.push(`[${guild.name}] Missing automod whitelist channel: ${channelId}`);
                    }
                }
            }
        }

        if (issues.length > 0) {
            console.warn('Startup health checks found issues:');
            issues.slice(0, 50).forEach(issue => console.warn(` - ${issue}`));
            if (issues.length > 50) {
                console.warn(` - ... and ${issues.length - 50} more`);
            }
        } else {
            console.log('Startup health checks passed.');
        }
    } catch (error) {
        console.error('Startup health checks failed:', error);
    }
}

module.exports = {
    runStartupChecks,
};
