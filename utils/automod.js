const configStore = require('../configStore');

function getAutomodConfig(guildId) {
    const config = configStore.get('automodConfig') || {};
    return config[guildId] || {
        enabled: false,
        antiSpam: { enabled: false, maxMessages: 5, timeWindow: 5000 },
        antiInvite: { enabled: false, whitelist: [] },
        antiCaps: { enabled: false, threshold: 70, minLength: 10 },
        antiMassMention: { enabled: false, max: 5 },
        antiEmoji: { enabled: false, max: 10 },
        customWords: [],
        regexFilters: [],
        blockedDomains: [],
        whitelistedChannels: [],
        whitelistedRoles: [],
        bypass: {
            admins: true,
            moderators: true,
            bots: true
        },
        punishment: 'warn'
    };
}

function setAutomodConfig(guildId, config) {
    const allConfigs = configStore.get('automodConfig') || {};
    allConfigs[guildId] = {
        ...getAutomodConfig(guildId),
        ...config,
    };
    configStore.set('automodConfig', allConfigs);
}

const messageCache = new Map();

function isExempt(member, config) {
    if (!member) return true;
    if (member.user?.bot && config.bypass?.bots !== false) return true;
    if (config.whitelistedRoles?.some(roleId => member.roles.cache.has(roleId))) return true;
    if (config.bypass?.admins !== false && member.permissions.has('Administrator')) return true;
    if (config.bypass?.moderators !== false && member.permissions.has('ManageMessages')) return true;
    return false;
}

function isChannelWhitelisted(channelId, config) {
    return Array.isArray(config.whitelistedChannels) && config.whitelistedChannels.includes(channelId);
}

function checkSpam(message, config) {
    if (!config.antiSpam?.enabled) return null;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const key = `${guildId}-${userId}`;
    const now = Date.now();

    if (!messageCache.has(key)) {
        messageCache.set(key, []);
    }

    const userMessages = messageCache.get(key);
    const recentMessages = userMessages.filter(msg => now - msg.timestamp < config.antiSpam.timeWindow);
    recentMessages.push({ timestamp: now, content: message.content });
    messageCache.set(key, recentMessages);

    const duplicates = recentMessages.filter(msg => msg.content === message.content);

    if (recentMessages.length > config.antiSpam.maxMessages || duplicates.length >= 3) {
        messageCache.set(key, []);
        return 'Spam detected';
    }

    return null;
}

function checkInvites(message, config) {
    if (!config.antiInvite?.enabled) return null;

    const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/gi;
    const matches = message.content.match(inviteRegex);
    if (!matches) return null;

    const whitelist = config.antiInvite.whitelist || [];
    const isWhitelisted = matches.some(invite =>
        whitelist.some(allowed => invite.toLowerCase().includes(String(allowed).toLowerCase()))
    );
    if (!isWhitelisted) return 'Discord invite link detected';
    return null;
}

function checkBlockedDomains(message, config) {
    const blocked = Array.isArray(config.blockedDomains) ? config.blockedDomains : [];
    if (!blocked.length) return null;

    const urls = message.content.match(/https?:\/\/[^\s]+/gi) || [];
    for (const raw of urls) {
        try {
            const host = new URL(raw).hostname.toLowerCase();
            const hit = blocked.find(d => host === d || host.endsWith(`.${d}`));
            if (hit) return `Blocked domain detected: ${hit}`;
        } catch (_error) {
            continue;
        }
    }
    return null;
}

function checkRegexFilters(message, config) {
    const filters = Array.isArray(config.regexFilters) ? config.regexFilters : [];
    if (!filters.length) return null;

    for (const pattern of filters) {
        try {
            const re = new RegExp(pattern, 'i');
            if (re.test(message.content)) {
                return `Regex filter matched: ${pattern}`;
            }
        } catch (_error) {
            continue;
        }
    }
    return null;
}

function checkCaps(message, config) {
    if (!config.antiCaps?.enabled) return null;
    const content = message.content;
    if (content.length < config.antiCaps.minLength) return null;

    const capsCount = (content.match(/[A-Z]/g) || []).length;
    const totalLetters = (content.match(/[a-zA-Z]/g) || []).length;
    if (totalLetters === 0) return null;

    const capsPercentage = (capsCount / totalLetters) * 100;
    if (capsPercentage > config.antiCaps.threshold) return `Excessive caps (${Math.round(capsPercentage)}%)`;
    return null;
}

function checkMassMention(message, config) {
    if (!config.antiMassMention?.enabled) return null;
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if (mentionCount > config.antiMassMention.max) return `Mass mention detected (${mentionCount} mentions)`;
    return null;
}

function checkEmojiSpam(message, config) {
    if (!config.antiEmoji?.enabled) return null;

    const customEmojiRegex = /<a?:\w+:\d+>/g;
    const customEmojis = (message.content.match(customEmojiRegex) || []).length;
    const unicodeEmojiRegex = /[\u{1F300}-\u{1F9FF}]/gu;
    const unicodeEmojis = (message.content.match(unicodeEmojiRegex) || []).length;
    const totalEmojis = customEmojis + unicodeEmojis;

    if (totalEmojis > config.antiEmoji.max) return `Emoji spam detected (${totalEmojis} emojis)`;
    return null;
}

function checkCustomWords(message, config) {
    if (!Array.isArray(config.customWords) || config.customWords.length === 0) return null;
    const content = message.content.toLowerCase();

    for (const word of config.customWords) {
        if (content.includes(String(word).toLowerCase())) {
            return `Filtered word detected: ${word}`;
        }
    }
    return null;
}

async function applyPunishment(message, reason, config) {
    const member = message.member;
    const punishment = config.punishment || 'warn';

    try {
        await message.delete().catch(() => {});

        switch (punishment) {
            case 'warn':
                await message.channel.send({
                    content: `⚠️ ${message.author}, your message was removed. Reason: ${reason}`,
                }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
                break;
            case 'timeout':
                await member.timeout(5 * 60 * 1000, `Automod: ${reason}`);
                await message.channel.send({
                    content: `🔇 ${message.author} has been timed out for 5 minutes. Reason: ${reason}`,
                }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
                break;
            case 'kick':
                await member.kick(`Automod: ${reason}`);
                await message.channel.send({ content: `👢 ${message.author.tag} has been kicked. Reason: ${reason}` });
                break;
            case 'ban':
                await member.ban({ reason: `Automod: ${reason}` });
                await message.channel.send({ content: `🔨 ${message.author.tag} has been banned. Reason: ${reason}` });
                break;
            default:
                break;
        }

        const logger = require('./logger');
        const logConfig = logger.getLogConfig(message.guild.id);
        if (logConfig.modLog) {
            const { EmbedBuilder } = require('discord.js');
            const logChannel = message.guild.channels.cache.get(logConfig.modLog);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6600')
                    .setTitle('🤖 Automod Action')
                    .setDescription(`**User:** ${message.author}\n**Channel:** ${message.channel}\n**Reason:** ${reason}\n**Action:** ${punishment}`)
                    .addFields({ name: 'Message Content', value: message.content.substring(0, 1024) || '*[No content]*' })
                    .setTimestamp();
                await logChannel.send({ embeds: [embed] });
            }
        }

        return true;
    } catch (error) {
        console.error('Error applying automod punishment:', error);
        return false;
    }
}

async function checkMessage(message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const config = getAutomodConfig(message.guild.id);
    if (!config.enabled) return;
    if (isExempt(message.member, config)) return;
    if (isChannelWhitelisted(message.channel.id, config)) return;

    const checks = [
        checkSpam(message, config),
        checkInvites(message, config),
        checkBlockedDomains(message, config),
        checkRegexFilters(message, config),
        checkCaps(message, config),
        checkMassMention(message, config),
        checkEmojiSpam(message, config),
        checkCustomWords(message, config)
    ];

    for (const result of checks) {
        if (result) {
            await applyPunishment(message, result, config);
            return true;
        }
    }

    return false;
}

setInterval(() => {
    const now = Date.now();
    for (const [key, messages] of messageCache.entries()) {
        const recentMessages = messages.filter(msg => now - msg.timestamp < 10000);
        if (recentMessages.length === 0) messageCache.delete(key);
        else messageCache.set(key, recentMessages);
    }
}, 60000);

module.exports = {
    getAutomodConfig,
    setAutomodConfig,
    checkMessage
};
