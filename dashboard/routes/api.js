const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'data', 'config.json');
const casesPath = path.join(__dirname, '..', '..', 'data', 'cases.json');
const warningsPath = path.join(__dirname, '..', '..', 'data', 'warnings.json');
const transcriptsPath = path.join(__dirname, '..', '..', 'data', 'transcripts');
const BOT_INVITE_PERMISSIONS = '8';
const { getGuildPerformance } = require('../../utils/performanceTracker');
const { createGuildBackup, listGuildBackups, restoreGuildBackup } = require('../../utils/guildBackup');
const { getGuildTags, setGuildTags } = require('../../utils/tags');

function readJson(file, fallback = {}) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function getConfig() {
  return readJson(configPath, {});
}

function saveConfig(config) {
  writeJson(configPath, config);
}

function getBotInviteUrl(client, guildId) {
  const botId = client?.user?.id || process.env.DISCORD_CLIENT_ID || '';
  if (!botId) return '#';

  const base = `https://discord.com/api/oauth2/authorize?client_id=${botId}&permissions=${BOT_INVITE_PERMISSIONS}&scope=bot%20applications.commands`;
  if (!guildId) return base;
  return `${base}&guild_id=${guildId}&disable_guild_select=true`;
}

function canManageGuild(user, guildId) {
  if (process.env.DASHBOARD_NO_AUTH === 'true') return true;
  return user?.guilds?.some(g => g.id === guildId && (g.permissions & 0x8) === 0x8);
}

const topLevelGuildSections = new Set(['roleConfig', 'logConfig', 'automodConfig', 'ticketConfig', 'reactionRoleConfig', 'antiNukeConfig', 'securityShieldConfig', 'extraOwnersConfig']);

function getGuildConfigSnapshot(allConfig, guildId) {
  const guildConfig = allConfig[guildId] || {};
  return {
    ...guildConfig,
    roleConfig: (allConfig.roleConfig || {})[guildId] || guildConfig.roleConfig || {},
    logConfig: (allConfig.logConfig || {})[guildId] || guildConfig.logConfig || {},
    automodConfig: (allConfig.automodConfig || {})[guildId] || guildConfig.automodConfig || {},
    antiNukeConfig: (allConfig.antiNukeConfig || {})[guildId] || guildConfig.antiNukeConfig || {},
    securityShieldConfig: (allConfig.securityShieldConfig || {})[guildId] || guildConfig.securityShieldConfig || {},
    extraOwnersConfig: (allConfig.extraOwnersConfig || {})[guildId] || guildConfig.extraOwnersConfig || {},
    ticketConfig: (allConfig.ticketConfig || {})[guildId] || guildConfig.ticketConfig || {},
    reactionRoleConfig: (allConfig.reactionRoleConfig || {})[guildId] || guildConfig.reactionRoleConfig || {},
    autoResponderConfig: guildConfig.autoResponderConfig || {},
    tagsConfig: { tags: getGuildTags(guildId) },
  };
}

function saveGuildSection(allConfig, guildId, section, data) {
  if (topLevelGuildSections.has(section)) {
    if (!allConfig[section] || typeof allConfig[section] !== 'object') {
      allConfig[section] = {};
    }
    allConfig[section][guildId] = {
      ...(allConfig[section][guildId] || {}),
      ...data,
    };
    return;
  }

  if (!allConfig[guildId] || typeof allConfig[guildId] !== 'object') {
    allConfig[guildId] = {};
  }

  allConfig[guildId][section] = {
    ...(allConfig[guildId][section] || {}),
    ...data,
  };
}

router.get('/guilds', async (req, res) => {
  try {
    const client = req.app.locals.client;
    let guilds = [];

    if (process.env.DASHBOARD_NO_AUTH === 'true') {
      guilds = client.guilds.cache.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        botPresent: true,
        inviteUrl: getBotInviteUrl(client, g.id),
      }));
    } else {
      guilds = (req.user.guilds || [])
        .filter(g => (g.permissions & 0x8) === 0x8)
        .map(g => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          botPresent: client.guilds.cache.has(g.id),
          inviteUrl: getBotInviteUrl(client, g.id),
        }));
    }

    res.json({ guilds });
  } catch (error) {
    console.error('Dashboard guild list error:', error);
    res.status(500).json({ error: 'Failed to load guild list' });
  }
});

router.get('/guild/:guildId/config', async (req, res) => {
  const { guildId } = req.params;
  if (!canManageGuild(req.user, guildId)) {
    res.status(403).json({ error: 'No permission' });
    return;
  }

  const config = getConfig();
  res.json(getGuildConfigSnapshot(config, guildId));
});

router.post('/guild/:guildId/config', async (req, res) => {
  const { guildId } = req.params;
  const { section, data } = req.body;

  if (!canManageGuild(req.user, guildId)) {
    res.status(403).json({ error: 'No permission' });
    return;
  }

  if (!section || typeof data !== 'object' || data === null) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const config = getConfig();
  if (section === 'tagsConfig') {
    setGuildTags(guildId, data.tags || {});
    res.json({ success: true, config: getGuildConfigSnapshot(config, guildId) });
    return;
  }
  saveGuildSection(config, guildId, section, data);

  saveConfig(config);
  res.json({ success: true, config: getGuildConfigSnapshot(config, guildId) });
});

router.get('/guild/:guildId/meta', async (req, res) => {
  const { guildId } = req.params;
  if (!canManageGuild(req.user, guildId)) {
    res.status(403).json({ error: 'No permission' });
    return;
  }

  try {
    const client = req.app.locals.client;
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      res.status(404).json({ error: 'Guild not found' });
      return;
    }

    const roles = guild.roles.cache
      .filter(r => r.id !== guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => ({ id: r.id, name: r.name }));

    const channels = guild.channels.cache
      .filter(c => c.isTextBased && c.isTextBased() && c.type === 0)
      .sort((a, b) => a.position - b.position)
      .map(c => ({ id: c.id, name: c.name }));

    res.json({
      guild: {
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
      },
      roles,
      channels,
    });
  } catch (error) {
    console.error('Dashboard meta error:', error);
    res.status(500).json({ error: 'Failed to load guild metadata' });
  }
});

router.get('/guild/:guildId/stats', async (req, res) => {
  const { guildId } = req.params;
  if (!canManageGuild(req.user, guildId)) {
    res.status(403).json({ error: 'No permission' });
    return;
  }

  const cases = readJson(casesPath, {});
  const warnings = readJson(warningsPath, {});
  const config = getConfig();

  const guildCases = cases[guildId] || {};
  const guildWarnings = warnings[guildId] || {};
  const openTickets = config[guildId]?.ticketConfig?.openTickets || [];

  let caseCount = 0;
  const caseTypeCounts = { warn: 0, timeout: 0, kick: 0, ban: 0, other: 0 };
  Object.values(guildCases).forEach(userCases => {
    userCases.forEach(c => {
      caseCount += 1;
      if (caseTypeCounts[c.type] !== undefined) caseTypeCounts[c.type] += 1;
      else caseTypeCounts.other += 1;
    });
  });

  let warningCount = 0;
  Object.values(guildWarnings).forEach(userWarnings => { warningCount += userWarnings.length; });

  res.json({
    caseCount,
    warningCount,
    openTickets: openTickets.length,
    caseTypeCounts,
  });
});

router.get('/guild/:guildId/summary', async (req, res) => {
  const { guildId } = req.params;
  if (!canManageGuild(req.user, guildId)) {
    res.status(403).json({ error: 'No permission' });
    return;
  }

  try {
    const client = req.app.locals.client;
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      res.status(404).json({ error: 'Guild not found' });
      return;
    }

    const config = getConfig();
    const guildConfig = getGuildConfigSnapshot(config, guildId);
    const automodConfig = guildConfig.automodConfig || {};
    const antiNukeConfig = guildConfig.antiNukeConfig || {};
    const securityShieldConfig = guildConfig.securityShieldConfig || {};
    const extraOwnersConfig = guildConfig.extraOwnersConfig || {};

    const textChannels = guild.channels.cache.filter(c => c.isTextBased && c.isTextBased() && c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
    const categories = guild.channels.cache.filter(c => c.type === 4).size;

    const ticketCfg = guildConfig.ticketConfig || {};
    const suggestionCfg = guildConfig.suggestionConfig || {};
    const verifyCfg = guildConfig.verifyConfig || {};
    const roleCfg = guildConfig.roleConfig || {};
    const logCfg = guildConfig.logConfig || {};

    const transcriptCount = fs.existsSync(transcriptsPath)
      ? fs.readdirSync(transcriptsPath).filter(file => file.includes(`-${guildId}.txt`)).length
      : 0;
    const performance = getGuildPerformance(guildId);

    res.json({
      guild: {
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        textChannels,
        voiceChannels,
        categories,
      },
      modules: {
        ticketEnabled: !!ticketCfg.enabled,
        suggestionEnabled: !!suggestionCfg.enabled,
        verificationEnabled: !!verifyCfg.enabled,
        automodEnabled: !!automodConfig.enabled,
        antiNukeEnabled: !!antiNukeConfig.enabled,
        securityShieldEnabled: !!securityShieldConfig.enabled,
        extraOwnersEnabled: Array.isArray(extraOwnersConfig.userIds) && extraOwnersConfig.userIds.length > 0,
        loggingEnabled: !!(logCfg.modLog || logCfg.messageLog || logCfg.memberLog || logCfg.voiceLog || logCfg.serverLog),
        welcomerEnabled: !!guildConfig.welcomerConfig?.enabled,
        starboardEnabled: !!guildConfig.starboardConfig?.enabled,
      },
      setup: {
        moderatorRoleId: roleCfg.moderatorRoleId || null,
        adminRoleId: roleCfg.adminRoleId || null,
        ticketPanelChannelId: ticketCfg.panelChannelId || null,
        ticketCategoryId: ticketCfg.categoryId || null,
        ticketSupportRoleCount: Array.isArray(ticketCfg.supportRoleIds) ? ticketCfg.supportRoleIds.length : 0,
        suggestionChannelId: suggestionCfg.channelId || null,
        verificationRoleId: verifyCfg.roleId || null,
        verificationMode: verifyCfg.mode || 'button',
        automodWordCount: Array.isArray(automodConfig.customWords) ? automodConfig.customWords.length : 0,
        automodWhitelistChannelCount: Array.isArray(automodConfig.whitelistedChannels) ? automodConfig.whitelistedChannels.length : 0,
        automodWhitelistRoleCount: Array.isArray(automodConfig.whitelistedRoles) ? automodConfig.whitelistedRoles.length : 0,
        antiNukeThreshold: antiNukeConfig.threshold || 3,
        antiNukeWindowSec: antiNukeConfig.intervalMs ? Math.round(antiNukeConfig.intervalMs / 1000) : 10,
        antiNukeWhitelistUsers: Array.isArray(antiNukeConfig.whitelistedUsers) ? antiNukeConfig.whitelistedUsers.length : 0,
        antiNukeWhitelistRoles: Array.isArray(antiNukeConfig.whitelistedRoles) ? antiNukeConfig.whitelistedRoles.length : 0,
        securityMinAccountAge: securityShieldConfig.antiAlt?.minAccountAgeDays || 3,
        securityJoinThreshold: securityShieldConfig.joinGuard?.maxJoins || 8,
        securityJoinWindowSec: securityShieldConfig.joinGuard?.windowMs ? Math.round(securityShieldConfig.joinGuard.windowMs / 1000) : 15,
        extraOwnerCount: Array.isArray(extraOwnersConfig.userIds) ? extraOwnersConfig.userIds.length : 0,
        transcriptCount,
        automodRegexCount: Array.isArray(automodConfig.regexFilters) ? automodConfig.regexFilters.length : 0,
        automodBlockedDomainCount: Array.isArray(automodConfig.blockedDomains) ? automodConfig.blockedDomains.length : 0,
        antiNukePreset: antiNukeConfig.preset || 'medium',
        autoResponderCount: Array.isArray(guildConfig.autoResponderConfig?.responders) ? guildConfig.autoResponderConfig.responders.length : 0,
        tagsCount: Object.keys(getGuildTags(guildId) || {}).length,
        roleMenuCount: Object.keys(guildConfig.reactionRoleConfig || {}).length,
      },
      performance,
    });
  } catch (error) {
    console.error('Dashboard guild summary error:', error);
    res.status(500).json({ error: 'Failed to load guild summary' });
  }
});

router.get('/guild/:guildId/activity', async (req, res) => {
  const { guildId } = req.params;
  if (!canManageGuild(req.user, guildId)) {
    res.status(403).json({ error: 'No permission' });
    return;
  }

  const limit = Math.min(Number(req.query.limit || 20), 50);
  const cases = readJson(casesPath, {});
  const warnings = readJson(warningsPath, {});

  const items = [];

  const guildCases = cases[guildId] || {};
  Object.entries(guildCases).forEach(([userId, userCases]) => {
    userCases.forEach(c => {
      items.push({
        type: 'case',
        action: c.type,
        userId,
        moderator: c.moderator,
        reason: c.reason,
        timestamp: c.timestamp,
      });
    });
  });

  const guildWarnings = warnings[guildId] || {};
  Object.entries(guildWarnings).forEach(([userId, userWarnings]) => {
    userWarnings.forEach(w => {
      items.push({
        type: 'warning',
        action: 'warn',
        userId,
        moderator: w.moderator,
        reason: w.reason,
        timestamp: w.timestamp,
      });
    });
  });

  items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  res.json({ activity: items.slice(0, limit) });
});

router.get('/guild/:guildId/backups', async (req, res) => {
  const { guildId } = req.params;
  if (!canManageGuild(req.user, guildId)) {
    res.status(403).json({ error: 'No permission' });
    return;
  }
  const backups = listGuildBackups(guildId).slice(0, 20);
  res.json({ backups });
});

router.post('/guild/:guildId/backups/create', async (req, res) => {
  const { guildId } = req.params;
  if (!canManageGuild(req.user, guildId)) {
    res.status(403).json({ error: 'No permission' });
    return;
  }
  const actorId = req.user?.id || null;
  const backup = createGuildBackup(guildId, actorId);
  res.json({ success: true, backup });
});

router.post('/guild/:guildId/backups/restore', async (req, res) => {
  const { guildId } = req.params;
  const { backupId } = req.body || {};
  if (!canManageGuild(req.user, guildId)) {
    res.status(403).json({ error: 'No permission' });
    return;
  }
  if (!backupId) {
    res.status(400).json({ error: 'backupId is required' });
    return;
  }
  const restored = restoreGuildBackup(guildId, backupId);
  if (!restored) {
    res.status(404).json({ error: 'Backup not found' });
    return;
  }
  res.json({ success: true, restored });
});

module.exports = router;
