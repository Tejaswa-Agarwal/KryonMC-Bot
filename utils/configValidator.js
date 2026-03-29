function normalizeGuildConfig(config = {}) {
    const next = { ...config };

    if (!next.roleConfig || typeof next.roleConfig !== 'object') next.roleConfig = {};
    if (!next.logConfig || typeof next.logConfig !== 'object') next.logConfig = {};
    if (!next.automodConfig || typeof next.automodConfig !== 'object') next.automodConfig = {};

    if (!next.automodConfig.bypass || typeof next.automodConfig.bypass !== 'object') {
        next.automodConfig.bypass = { admins: true, moderators: true, bots: true };
    }

    if (!Array.isArray(next.automodConfig.regexFilters)) next.automodConfig.regexFilters = [];
    if (!Array.isArray(next.automodConfig.blockedDomains)) next.automodConfig.blockedDomains = [];
    if (!Array.isArray(next.automodConfig.whitelistedChannels)) next.automodConfig.whitelistedChannels = [];
    if (!Array.isArray(next.automodConfig.whitelistedRoles)) next.automodConfig.whitelistedRoles = [];
    if (!Array.isArray(next.automodConfig.customWords)) next.automodConfig.customWords = [];

    return next;
}

module.exports = {
    normalizeGuildConfig,
};
