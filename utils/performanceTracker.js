const fs = require('fs');
const path = require('path');

const perfFile = path.join(__dirname, '..', 'data', 'performance.json');

function readPerf() {
    if (!fs.existsSync(perfFile)) return {};
    try {
        return JSON.parse(fs.readFileSync(perfFile, 'utf8'));
    } catch (_error) {
        return {};
    }
}

function writePerf(data) {
    fs.writeFileSync(perfFile, JSON.stringify(data, null, 2));
}

function trimHistory(history, max = 200) {
    if (!Array.isArray(history)) return [];
    if (history.length <= max) return history;
    return history.slice(history.length - max);
}

function recordCommandExecution(guildId, type, commandName, durationMs, ok) {
    if (!guildId) return;
    const all = readPerf();
    const guild = all[guildId] || {
        totals: { count: 0, failed: 0, totalMs: 0 },
        commands: {},
        history: []
    };

    guild.totals.count += 1;
    guild.totals.totalMs += durationMs;
    if (!ok) guild.totals.failed += 1;

    const key = `${type}:${commandName}`;
    const cmd = guild.commands[key] || { count: 0, failed: 0, totalMs: 0, maxMs: 0 };
    cmd.count += 1;
    cmd.totalMs += durationMs;
    if (!ok) cmd.failed += 1;
    if (durationMs > cmd.maxMs) cmd.maxMs = durationMs;
    guild.commands[key] = cmd;

    guild.history.push({
        ts: Date.now(),
        type,
        commandName,
        durationMs,
        ok
    });
    guild.history = trimHistory(guild.history, 300);
    all[guildId] = guild;
    writePerf(all);
}

function getGuildPerformance(guildId) {
    const all = readPerf();
    const guild = all[guildId];
    if (!guild) {
        return {
            totals: { count: 0, failed: 0, avgMs: 0 },
            slowest: [],
            recent: []
        };
    }

    const avgMs = guild.totals.count ? Math.round(guild.totals.totalMs / guild.totals.count) : 0;
    const slowest = Object.entries(guild.commands)
        .map(([name, info]) => ({
            name,
            avgMs: info.count ? Math.round(info.totalMs / info.count) : 0,
            maxMs: info.maxMs || 0,
            count: info.count,
            failed: info.failed
        }))
        .sort((a, b) => b.avgMs - a.avgMs)
        .slice(0, 5);

    const recent = (guild.history || []).slice(-10).reverse();

    return {
        totals: {
            count: guild.totals.count,
            failed: guild.totals.failed,
            avgMs
        },
        slowest,
        recent
    };
}

module.exports = {
    recordCommandExecution,
    getGuildPerformance
};
