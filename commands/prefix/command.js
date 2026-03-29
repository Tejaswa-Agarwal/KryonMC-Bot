const fs = require('fs');
const path = require('path');
const { hasAdminPermission } = require('../../utils/permissions');

const commandStatusFile = path.join(__dirname, '..', '..', 'data', 'commandStatus.json');
let commandStatus = {};

const moduleStatusFile = path.join(__dirname, '..', '..', 'data', 'moduleStatus.json');
let moduleStatus = {};

// Load command status from file
function loadCommandStatus() {
    if (fs.existsSync(commandStatusFile)) {
        const rawData = fs.readFileSync(commandStatusFile);
        commandStatus = JSON.parse(rawData);
    } else {
        commandStatus = {};
    }
}

// Save command status to file
function saveCommandStatus() {
    fs.writeFileSync(commandStatusFile, JSON.stringify(commandStatus, null, 2));
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

module.exports = {
    name: 'command',
    description: 'Enable or disable bot commands and modules',
    usage: '!command <enable|disable> <commandName>',
    async execute(message, args) {
        if (!hasAdminPermission(message.member, message.guild.id, message.author.id, message.guild.ownerId)) {
            return message.reply('You do not have permission to use this command.');
        }

        if (args.length < 2) {
            return message.reply('Usage: !command <enable|disable> <commandName>');
        }

        const action = args[0].toLowerCase();
        const name = args[1].toLowerCase();

        if (!['enable', 'disable'].includes(action)) {
            return message.reply('First argument must be "enable" or "disable".');
        }

        loadCommandStatus();
        loadModuleStatus();

        if (name === 'automod' || name === 'leveling') {
            moduleStatus[name] = (action === 'enable');
            saveModuleStatus();
            message.reply(`✅ Module "${name}" has been ${action}d.`);
        } else {
            commandStatus[name] = (action === 'enable');
            saveCommandStatus();
            message.reply(`✅ Command "${name}" has been ${action}d.`);
        }
    }
};
