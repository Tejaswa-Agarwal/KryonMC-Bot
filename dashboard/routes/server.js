const express = require('express');
const router = express.Router();

function canManageGuild(user, guildId) {
  if (process.env.DASHBOARD_NO_AUTH === 'true') return true;
  return user?.guilds?.some(g => g.id === guildId && (g.permissions & 0x8) === 0x8);
}

router.get('/:guildId', async (req, res) => {
  const { guildId } = req.params;
  const client = req.app.locals.client;
  const guild = client.guilds.cache.get(guildId);

  if (!guild) {
    res.status(404).render('404', { user: req.user, message: 'Guild not found' });
    return;
  }

  if (!canManageGuild(req.user, guildId)) {
    res.status(403).render('error', { user: req.user, message: 'You do not have access to this server.' });
    return;
  }

  res.render('server/overview', { user: req.user, guild });
});

module.exports = router;
