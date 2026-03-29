const { EmbedBuilder } = require('discord.js');
const configStore = require('../configStore');
const { getLogConfig } = require('./logger');
const { recordIncident } = require('./incidentTracker');

const joinTracker = new Map();

function getSecurityConfig(guildId) {
    const all = configStore.get('securityShieldConfig') || {};
    return all[guildId] || {
        enabled: false,
        quarantineRoleId: null,
        antiAlt: {
            enabled: true,
            minAccountAgeDays: 3,
            action: 'kick', // kick, quarantine, alert
        },
        joinGuard: {
            enabled: true,
            maxJoins: 8,
            windowMs: 15000,
            action: 'alert', // alert, kick
        },
    };
}

function setSecurityConfig(guildId, config) {
    const all = configStore.get('securityShieldConfig') || {};
    all[guildId] = {
        ...getSecurityConfig(guildId),
        ...config,
    };
    configStore.set('securityShieldConfig', all);
}

async function sendSecurityLog(guild, title, description, color = 0xF59E0B) {
    const logConfig = getLogConfig(guild.id);
    const channelId = logConfig.modLog || logConfig.serverLog;
    const channel = channelId ? guild.channels.cache.get(channelId) : guild.systemChannel;
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
    await channel.send({ embeds: [embed] }).catch(() => {});
}

function trackGuildJoin(guildId, windowMs) {
    const now = Date.now();
    const existing = joinTracker.get(guildId) || [];
    const recent = existing.filter(ts => now - ts <= windowMs);
    recent.push(now);
    joinTracker.set(guildId, recent);
    return recent.length;
}

async function applyAntiAltAction(member, config, ageDays) {
    const mode = config.antiAlt?.action || 'kick';
    if (mode === 'kick' && member.kickable) {
        await member.kick(`Security shield: new account (${ageDays}d old)`);
        return 'kicked';
    }

    if (mode === 'quarantine' && config.quarantineRoleId) {
        const role = member.guild.roles.cache.get(config.quarantineRoleId);
        if (role) {
            await member.roles.add(role, 'Security shield quarantine');
            return `quarantined with ${role.name}`;
        }
    }

    return 'alerted';
}

async function handleMemberJoin(member) {
    const config = getSecurityConfig(member.guild.id);
    if (!config.enabled) return { blocked: false };
    if (member.user.bot) return { blocked: false };

    let blocked = false;

    if (config.joinGuard?.enabled) {
        const count = trackGuildJoin(member.guild.id, config.joinGuard.windowMs || 15000);
        const threshold = config.joinGuard.maxJoins || 8;
        if (count >= threshold) {
            if (config.joinGuard.action === 'kick' && member.kickable) {
                await member.kick(`Security shield: join raid pattern (${count} joins)`).catch(() => {});
                blocked = true;
            }
            await sendSecurityLog(
                member.guild,
                '🚨 Join Guard Triggered',
                `Rapid joins detected: **${count}** joins in ${Math.round((config.joinGuard.windowMs || 15000) / 1000)}s.\nLatest member: ${member.user.tag} (\`${member.id}\`)`,
                0xEF4444
            );
            recordIncident(member.guild.id, {
                type: 'security',
                severity: 'high',
                source: 'join-guard',
                userId: member.id,
                details: `joins=${count}`,
                response: config.joinGuard.action
            });
        }
    }

    if (blocked) return { blocked: true };

    if (config.antiAlt?.enabled) {
        const accountAgeMs = Date.now() - member.user.createdTimestamp;
        const minAgeDays = config.antiAlt.minAccountAgeDays || 3;
        const minAgeMs = minAgeDays * 24 * 60 * 60 * 1000;

        if (accountAgeMs < minAgeMs) {
            const ageDays = Math.max(0, Math.floor(accountAgeMs / (24 * 60 * 60 * 1000)));
            const result = await applyAntiAltAction(member, config, ageDays).catch(() => 'alerted');
            if (result === 'kicked') blocked = true;

            await sendSecurityLog(
                member.guild,
                '🛡️ Anti-Alt Triggered',
                `User: ${member.user.tag} (\`${member.id}\`)\nAccount age: **${ageDays}d**\nAction: **${result}**`,
                result === 'kicked' ? 0xEF4444 : 0xF59E0B
            );
            recordIncident(member.guild.id, {
                type: 'security',
                severity: result === 'kicked' ? 'high' : 'medium',
                source: 'anti-alt',
                userId: member.id,
                details: `ageDays=${ageDays}`,
                response: result
            });
        }
    }

    return { blocked };
}

module.exports = {
    getSecurityConfig,
    setSecurityConfig,
    handleMemberJoin,
};
