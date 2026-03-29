const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'data', 'config.json');
const backupPath = path.join(__dirname, '..', 'data', 'guildBackups.json');

const topLevelGuildSections = ['roleConfig', 'logConfig', 'automodConfig', 'ticketConfig', 'reactionRoleConfig', 'antiNukeConfig', 'securityShieldConfig', 'extraOwnersConfig'];

function readJson(file, fallback = {}) {
    if (!fs.existsSync(file)) return fallback;
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (_error) {
        return fallback;
    }
}

function writeJson(file, value) {
    fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function createGuildBackup(guildId, actorId = null) {
    const config = readJson(configPath, {});
    const backups = readJson(backupPath, {});

    const snapshot = {
        guildConfig: config[guildId] || {},
        sections: {}
    };

    for (const section of topLevelGuildSections) {
        snapshot.sections[section] = (config[section] || {})[guildId] || {};
    }

    const entry = {
        id: `bkp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        guildId,
        actorId,
        createdAt: Date.now(),
        snapshot
    };

    const list = Array.isArray(backups[guildId]) ? backups[guildId] : [];
    list.push(entry);
    backups[guildId] = list.slice(-20);
    writeJson(backupPath, backups);

    return entry;
}

function listGuildBackups(guildId) {
    const backups = readJson(backupPath, {});
    const list = Array.isArray(backups[guildId]) ? backups[guildId] : [];
    return [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function restoreGuildBackup(guildId, backupId) {
    const backups = readJson(backupPath, {});
    const list = Array.isArray(backups[guildId]) ? backups[guildId] : [];
    const entry = list.find(item => item.id === backupId);
    if (!entry) return null;

    const config = readJson(configPath, {});
    config[guildId] = entry.snapshot?.guildConfig || {};

    for (const section of topLevelGuildSections) {
        if (!config[section] || typeof config[section] !== 'object') {
            config[section] = {};
        }
        const sectionData = entry.snapshot?.sections?.[section];
        if (sectionData && Object.keys(sectionData).length > 0) {
            config[section][guildId] = sectionData;
        } else {
            delete config[section][guildId];
        }
    }

    writeJson(configPath, config);
    return entry;
}

module.exports = {
    createGuildBackup,
    listGuildBackups,
    restoreGuildBackup
};
