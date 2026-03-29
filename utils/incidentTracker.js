const fs = require('fs');
const path = require('path');

const incidentsPath = path.join(__dirname, '..', 'data', 'incidents.json');

function readIncidents() {
    if (!fs.existsSync(incidentsPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(incidentsPath, 'utf8'));
    } catch (_error) {
        return {};
    }
}

function writeIncidents(data) {
    fs.writeFileSync(incidentsPath, JSON.stringify(data, null, 2));
}

function recordIncident(guildId, payload) {
    if (!guildId || !payload || !payload.type) return;
    const all = readIncidents();
    if (!Array.isArray(all[guildId])) all[guildId] = [];
    all[guildId].push({
        id: `inc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        severity: payload.severity || 'medium',
        ...payload
    });
    all[guildId] = all[guildId].slice(-500);
    writeIncidents(all);
}

function getGuildIncidents(guildId, limit = 50) {
    const all = readIncidents();
    const list = Array.isArray(all[guildId]) ? all[guildId] : [];
    return [...list]
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, limit);
}

function getIncidentStats(guildId) {
    const list = getGuildIncidents(guildId, 500);
    const stats = {
        total: list.length,
        antiNuke: 0,
        security: 0,
        automod: 0,
        high: 0,
        medium: 0,
        low: 0
    };
    for (const item of list) {
        if (item.type === 'antinuke') stats.antiNuke += 1;
        if (item.type === 'security') stats.security += 1;
        if (item.type === 'automod') stats.automod += 1;
        if (item.severity === 'high') stats.high += 1;
        else if (item.severity === 'low') stats.low += 1;
        else stats.medium += 1;
    }
    return stats;
}

module.exports = {
    recordIncident,
    getGuildIncidents,
    getIncidentStats
};
