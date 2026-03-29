const { PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const badWords = ['badword1', 'badword2', 'badword3']; // Add actual bad words here
const spamThreshold = 5; // Number of messages in interval to consider spam
const spamInterval = 10000; // 10 seconds
const muteDuration = 600000; // 10 minutes in milliseconds

const userMessageMap = new Map();

const levelsFilePath = path.join(__dirname, '..', 'data', 'levels.json');
let levelsData = {};

const moduleStatusFile = path.join(__dirname, '..', 'data', 'moduleStatus.json');
let moduleStatus = {};

// Load levels data from file
function loadLevelsData() {
    if (fs.existsSync(levelsFilePath)) {
        const rawData = fs.readFileSync(levelsFilePath);
        levelsData = JSON.parse(rawData);
    } else {
        levelsData = {};
    }
}

// Save levels data to file
function saveLevelsData() {
    fs.writeFileSync(levelsFilePath, JSON.stringify(levelsData, null, 2));
}

// Load module status from file
function loadModuleStatus() {
    if (fs.existsSync(moduleStatusFile)) {
        const rawData = fs.readFileSync(moduleStatusFile);
        moduleStatus = JSON.parse(rawData);
    } else {
        moduleStatus = {
            automod: true,
            leveling: true
        };
    }
}

// Save module status to file
function saveModuleStatus() {
    fs.writeFileSync(moduleStatusFile, JSON.stringify(moduleStatus, null, 2));
}

// Calculate XP needed for next level (example formula)
function getXpForLevel(level) {
    return 5 * (level ** 2) + 50 * level + 100;
}

// Levels to roles mapping (level: roleId)
const levelRoles = {
    5: 'ROLE_ID_FOR_LEVEL_5',
    10: 'ROLE_ID_FOR_LEVEL_10',
    20: 'ROLE_ID_FOR_LEVEL_20',
    // Add more levels and role IDs as needed
};

module.exports = (client) => {
    loadLevelsData();
    loadModuleStatus();

    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        // AFK system - check for AFK mentions and remove AFK status
        const afk = require('../utils/afk');
        await afk.checkAFKMentions(message);

        // Auto responder
        const autoResponder = require('../utils/autoResponder');
        await autoResponder.handleAutoResponderMessage(message);

        // New enhanced automod system
        const automod = require('../utils/automod');
        const handled = await automod.checkMessage(message);
        if (handled) return; // Message was handled by automod

        // Legacy automod (still runs if not handled by new system)
        if (moduleStatus.automod) {
            // Bad word filtering
            const messageContent = message.content.toLowerCase();
            if (badWords.some(word => messageContent.includes(word))) {
                try {
                    await message.delete();
                    await message.channel.send(`${message.author}, your message contained inappropriate language and was removed.`);
                    // Optionally warn the user here
                } catch (err) {
                    console.error('Failed to delete message or send warning:', err);
                }
                return;
            }

            // Spam detection
            const userId = message.author.id;
            const now = Date.now();

            if (!userMessageMap.has(userId)) {
                userMessageMap.set(userId, []);
            }

            const timestamps = userMessageMap.get(userId);
            timestamps.push(now);

            // Remove timestamps older than spamInterval
            while (timestamps.length > 0 && timestamps[0] <= now - spamInterval) {
                timestamps.shift();
            }

            if (timestamps.length >= spamThreshold) {
                // Take action: mute or warn
                const member = message.member;
                if (!member) return;

                if (member.permissions.has(PermissionsBitField.Flags.MuteMembers)) return; // Don't mute mods/admins

                try {
                    // Mute the member by adding a "Muted" role
                    let muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
                    if (!muteRole) {
                        muteRole = await message.guild.roles.create({
                            name: 'Muted',
                            permissions: []
                        });
                        message.guild.channels.cache.forEach(async (channel) => {
                            await channel.permissionOverwrites.edit(muteRole, {
                                SendMessages: false,
                                AddReactions: false,
                                Speak: false
                            });
                        });
                    }

                    if (!member.roles.cache.has(muteRole.id)) {
                        await member.roles.add(muteRole);
                        await message.channel.send(`${member} has been muted for spamming.`);
                        setTimeout(async () => {
                            if (member.roles.cache.has(muteRole.id)) {
                                await member.roles.remove(muteRole);
                                await message.channel.send(`${member} has been unmuted.`);
                            }
                        }, muteDuration);
                    }
                } catch (err) {
                    console.error('Failed to mute member:', err);
                }

                // Clear timestamps to prevent repeated mute
                userMessageMap.set(userId, []);
                return;
            }
        }

        if (moduleStatus.leveling) {
            // Leveling system
            const userId = message.author.id;
            if (!levelsData[userId]) {
                levelsData[userId] = {
                    xp: 0,
                    level: 1
                };
            }

            const userData = levelsData[userId];
            const xpGain = Math.floor(Math.random() * 10) + 15; // Random XP gain between 15-24
            userData.xp += xpGain;

            const xpForNextLevel = getXpForLevel(userData.level);
            if (userData.xp >= xpForNextLevel) {
                userData.level++;
                userData.xp -= xpForNextLevel;

                // Assign role if level matches
                const roleId = levelRoles[userData.level];
                if (roleId) {
                    const role = message.guild.roles.cache.get(roleId);
                    if (role && !message.member.roles.cache.has(roleId)) {
                        try {
                            await message.member.roles.add(role);
                            await message.channel.send(`${message.member}, congratulations on reaching level ${userData.level} and earning the role ${role.name}!`);
                        } catch (err) {
                            console.error('Failed to assign role:', err);
                        }
                    }
                }
            }

            saveLevelsData();
        }
    });
};
