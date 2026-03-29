const path = require('path');
const { readJsonFile, writeJsonFile } = require('./jsonFile');

const auditPath = path.join(__dirname, '..', 'data', 'configAudit.json');

function appendConfigAudit(entry) {
    const all = readJsonFile(auditPath, {});
    const guildId = entry.guildId;
    if (!guildId) return;

    if (!Array.isArray(all[guildId])) all[guildId] = [];
    all[guildId].push({
        id: `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        ...entry,
    });
    all[guildId] = all[guildId].slice(-500);
    writeJsonFile(auditPath, all);
}

module.exports = {
    appendConfigAudit,
};
