const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'data', 'config.json');

function getConfig() {
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return {};
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
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
      }));
    } else {
      guilds = (req.user.guilds || [])
        .filter(g => (g.permissions & 0x8) === 0x8)
        .map(g => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          botPresent: client.guilds.cache.has(g.id),
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

module.exports = router;
