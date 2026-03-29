const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'data', 'config.json');

function readConfig() {
    if (!fs.existsSync(configPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (_error) {
        return {};
    }
}

function writeConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getAutoResponderConfig(guildId) {
    const config = readConfig();
    return config[guildId]?.autoResponderConfig || {
        enabled: false,
        responders: []
    };
}

function setAutoResponderConfig(guildId, autoResponderConfig) {
    const config = readConfig();
    if (!config[guildId]) config[guildId] = {};
    config[guildId].autoResponderConfig = {
        enabled: !!autoResponderConfig.enabled,
        responders: Array.isArray(autoResponderConfig.responders) ? autoResponderConfig.responders : []
    };
    writeConfig(config);
}

async function handleAutoResponderMessage(message) {
    if (!message.guild || message.author.bot) return false;
    if (message.content.startsWith('k!')) return false;

    const cfg = getAutoResponderConfig(message.guild.id);
    if (!cfg.enabled || !Array.isArray(cfg.responders) || cfg.responders.length === 0) return false;

    const input = message.content.toLowerCase();
    for (const responder of cfg.responders) {
        const trigger = String(responder.trigger || '').toLowerCase().trim();
        const response = String(responder.response || '').trim();
        const mode = responder.mode === 'exact' ? 'exact' : 'contains';
        if (!trigger || !response) continue;

        const matched = mode === 'exact' ? input === trigger : input.includes(trigger);
        if (!matched) continue;

        await message.channel.send(response).catch(() => {});
        return true;
    }

    return false;
}

module.exports = {
    getAutoResponderConfig,
    setAutoResponderConfig,
    handleAutoResponderMessage
};
