const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'data', 'config.json');
const casesPath = path.join(__dirname, '..', '..', 'data', 'cases.json');
const warningsPath = path.join(__dirname, '..', '..', 'data', 'warnings.json');
const BOT_INVITE_PERMISSIONS = '8';

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
  res.json(config[guildId] || {});
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
  if (!config[guildId]) config[guildId] = {};
  config[guildId][section] = {
    ...(config[guildId][section] || {}),
    ...data,
  };

  saveConfig(config);
  res.json({ success: true, config: config[guildId] });
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

module.exports = router;
