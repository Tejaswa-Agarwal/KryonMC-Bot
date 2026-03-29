const { AuditLogEvent, EmbedBuilder, PermissionsBitField } = require('discord.js');
const configStore = require('../configStore');
const { BOT_OWNER_ID } = require('./permissions');
const { getLogConfig } = require('./logger');

const actionTracker = new Map();

function getAntiNukeConfig(guildId) {
    const all = configStore.get('antiNukeConfig') || {};
    return all[guildId] || {
        enabled: false,
        preset: 'medium',
        threshold: 3,
        intervalMs: 10000,
        action: 'remove_roles', // remove_roles, kick, ban
        whitelistedUsers: [],
        whitelistedRoles: [],
        applyToAdmins: false,
    };
}

function setAntiNukeConfig(guildId, config) {
    const all = configStore.get('antiNukeConfig') || {};
    all[guildId] = {
        ...getAntiNukeConfig(guildId),
        ...config,
    };
    configStore.set('antiNukeConfig', all);
}

function isWhitelisted(member, config) {
    if (!member) return true;
    if (config.whitelistedUsers?.includes(member.id)) return true;
    if (config.whitelistedRoles?.some(roleId => member.roles.cache.has(roleId))) return true;
    return false;
}

async function sendAntiNukeLog(guild, title, description, color = 0xEF4444) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();

    const logConfig = getLogConfig(guild.id);
    const channelId = logConfig.modLog || logConfig.serverLog;
    const channel = channelId ? guild.channels.cache.get(channelId) : guild.systemChannel;
    if (channel) {
        await channel.send({ embeds: [embed] }).catch(() => {});
    }
}

function trackExecutorAction(guildId, executorId, intervalMs) {
    const key = `${guildId}:${executorId}`;
    const now = Date.now();
    const existing = actionTracker.get(key) || [];
    const recent = existing.filter(ts => now - ts <= intervalMs);
    recent.push(now);
    actionTracker.set(key, recent);
    return recent.length;
}

async function applyAction(member, config, reason) {
    if (!member) return { ok: false, detail: 'executor member not found' };

    try {
        if (config.action === 'ban') {
            if (member.bannable) {
                await member.ban({ reason });
                return { ok: true, detail: 'banned' };
            }
        } else if (config.action === 'kick') {
            if (member.kickable) {
                await member.kick(reason);
                return { ok: true, detail: 'kicked' };
            }
        }

        const removableRoles = member.roles.cache.filter(role =>
            role.id !== member.guild.id &&
            !role.managed &&
            role.position < member.guild.members.me.roles.highest.position
        );

        if (removableRoles.size > 0) {
            await member.roles.remove([...removableRoles.values()], reason);
            return { ok: true, detail: `removed ${removableRoles.size} roles` };
        }

        return { ok: false, detail: 'no removable roles and action not possible' };
    } catch (error) {
        return { ok: false, detail: error.message || 'failed to apply action' };
    }
}

async function enforceAntiNuke(guild, executorId, actionLabel) {
    if (!guild || !executorId) return;

    const config = getAntiNukeConfig(guild.id);
    if (!config.enabled) return;

    if (executorId === BOT_OWNER_ID || executorId === guild.ownerId || executorId === guild.client.user.id) {
        return;
    }

    const member = await guild.members.fetch(executorId).catch(() => null);
    if (!member) return;
    if (isWhitelisted(member, config)) return;
    if (member.permissions.has(PermissionsBitField.Flags.Administrator) && !config.applyToAdmins) return;

    const count = trackExecutorAction(guild.id, executorId, config.intervalMs || 10000);
    if (count < (config.threshold || 3)) return;

    actionTracker.set(`${guild.id}:${executorId}`, []);
    const reason = `Anti-nuke triggered after ${count} destructive actions (${actionLabel})`;
    const result = await applyAction(member, config, reason);

    const tag = member.user?.tag || executorId;
    await sendAntiNukeLog(
        guild,
        '🛡️ Anti-Nuke Triggered',
        `**Executor:** ${tag} (\`${executorId}\`)\n**Detected:** ${actionLabel}\n**Actions in window:** ${count}\n**Response:** ${result.detail}`
    );
}

async function getExecutorIdFromAudit(guild, type) {
    const logs = await guild.fetchAuditLogs({ type, limit: 1 }).catch(() => null);
    const entry = logs?.entries?.first();
    if (!entry) return null;
    if (Date.now() - entry.createdTimestamp > 15000) return null;
    return entry.executorId || null;
}

async function handleChannelDelete(channel) {
    const executorId = await getExecutorIdFromAudit(channel.guild, AuditLogEvent.ChannelDelete);
    await enforceAntiNuke(channel.guild, executorId, 'channel delete');
}

async function handleChannelCreate(channel) {
    const executorId = await getExecutorIdFromAudit(channel.guild, AuditLogEvent.ChannelCreate);
    await enforceAntiNuke(channel.guild, executorId, 'channel create');
}

async function handleRoleDelete(role) {
    const executorId = await getExecutorIdFromAudit(role.guild, AuditLogEvent.RoleDelete);
    await enforceAntiNuke(role.guild, executorId, 'role delete');
}

async function handleRoleCreate(role) {
    const executorId = await getExecutorIdFromAudit(role.guild, AuditLogEvent.RoleCreate);
    await enforceAntiNuke(role.guild, executorId, 'role create');
}

module.exports = {
    getAntiNukeConfig,
    setAntiNukeConfig,
    handleChannelDelete,
    handleChannelCreate,
    handleRoleDelete,
    handleRoleCreate,
};
