require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, EmbedBuilder, Collection } = require('discord.js');
const messageCreateEvent = require('./events/messageCreate');
const { REST, Routes } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
    partials: [Partials.Channel],
});

const logsCommand = require('./commands/slash/logs');
const configStore = require('./configStore');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const ALLOWED_ROLE_IDS = (process.env.ALLOWED_ROLE_IDS || '').split(',').map(r => r.trim()).filter(r => r.length > 0);
const MODERATOR_ROLE_IDS = (process.env.MODERATOR_ROLE_IDS || '').split(',').map(r => r.trim()).filter(r => r.length > 0);
const ADMIN_ROLE_IDS = (process.env.ADMIN_ROLE_IDS || '').split(',').map(r => r.trim()).filter(r => r.length > 0);

client.prefixCommands = new Collection();
client.slashCommands = new Collection();

const commandStatusFile = path.join(__dirname, 'data', 'commandStatus.json');
let commandStatus = {};

let loggingChannelId = configStore.get('loggingChannelId') || null;
let liveStatusChannelId = configStore.get('liveStatusChannelId') || null;

// Load command status from file
function loadCommandStatus() {
    if (fs.existsSync(commandStatusFile)) {
        const rawData = fs.readFileSync(commandStatusFile);
        commandStatus = JSON.parse(rawData);
    } else {
        commandStatus = {};
    }
}

loadCommandStatus();

const prefixCommandsPath = path.join(__dirname, 'commands', 'prefix');
const slashCommandsPath = path.join(__dirname, 'commands', 'slash');

// Load prefix commands
fs.readdirSync(prefixCommandsPath).forEach(file => {
    if (file.endsWith('.js')) {
        const command = require(path.join(prefixCommandsPath, file));
        client.prefixCommands.set(command.name, command);
    }
});

// Load slash commands
const slashCommands = [];
fs.readdirSync(slashCommandsPath).forEach(file => {
    if (file.endsWith('.js')) {
        const command = require(path.join(slashCommandsPath, file));
        client.slashCommands.set(command.data.name, command);
        slashCommands.push(command.data);
    }
});

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

async function registerCommands() {
    try {
        // Register commands globally
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: slashCommands.map(cmd => cmd.toJSON ? cmd.toJSON() : cmd) },
        );
        console.log('Successfully registered slash commands.');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
}

// Periodically re-register slash commands every 5 minutes to prevent disappearance
setInterval(() => {
    if (client.isReady()) {
        console.log('Re-registering slash commands to prevent disappearance...');
        registerCommands();
    }
}, 5 * 60 * 1000); // 5 minutes interval

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await registerCommands();
    // Register messageCreate event for automod
    messageCreateEvent(client);
});

function createLogEmbedForPrefixCommand(message, command, args) {
    const embed = new EmbedBuilder()
        .setTitle('Command Usage Log (Prefix Command)')
        .setColor(0x0099FF)
        .addFields(
            { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Command', value: command.name, inline: true },
            { name: 'Arguments', value: args.length > 0 ? args.join(' ') : 'None', inline: false },
            { name: 'Guild', value: message.guild ? `${message.guild.name} (${message.guild.id})` : 'DM', inline: true },
            { name: 'Channel', value: message.channel ? `${message.channel.name} (${message.channel.id})` : 'DM', inline: true },
            { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
        );
    return embed;
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefix = 'k!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.prefixCommands.get(commandName);
    if (!command) return;

    // Check permissions based on command category
    const memberRoles = message.member?.roles.cache;
    
    // Moderation commands require moderator role
    const moderationCommands = ['ban', 'unban', 'kick', 'timeout', 'purge', 'purgeuser', 'slowmode', 'lock', 'unlock', 'warn', 'warnings', 'setnick'];
    if (moderationCommands.includes(commandName)) {
        if (MODERATOR_ROLE_IDS.length > 0 && !MODERATOR_ROLE_IDS.some(roleId => memberRoles?.has(roleId))) {
            if (ADMIN_ROLE_IDS.length === 0 || !ADMIN_ROLE_IDS.some(roleId => memberRoles?.has(roleId))) {
                message.channel.send('You do not have permission to use this command.');
                return;
            }
        }
    }
    
    // Admin commands require admin role
    const adminCommands = ['announce', 'command', 'say', 'clearwarns'];
    if (adminCommands.includes(commandName)) {
        if (ADMIN_ROLE_IDS.length > 0 && !ADMIN_ROLE_IDS.some(roleId => memberRoles?.has(roleId))) {
            message.channel.send('You do not have permission to use this command.');
            return;
        }
    }

    // Giveaway commands require allowed roles
    if (commandName === 'giveaway') {
        if (ALLOWED_ROLE_IDS.length > 0 && !ALLOWED_ROLE_IDS.some(roleId => memberRoles?.has(roleId))) {
            if (ADMIN_ROLE_IDS.length === 0 || !ADMIN_ROLE_IDS.some(roleId => memberRoles?.has(roleId))) {
                message.channel.send('You do not have permission to use this command.');
                return;
            }
        }
    }

    try {
        await command.execute(message, args);
        // Send command usage log if logging channel is set
        const logChannelId = loggingChannelId || logsCommand.getLoggingChannelId();
        if (logChannelId) {
            const logChannel = message.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const embed = createLogEmbedForPrefixCommand(message, command, args);
                logChannel.send({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error(`Error executing prefix command ${commandName}:`, error);
        message.channel.send('An error occurred while executing the command.');
    }
});

function createLogEmbedForSlashCommand(interaction, command) {
    const options = interaction.options.data.map(opt => `${opt.name}: ${opt.value}`).join('\n') || 'None';

    const embed = new EmbedBuilder()
        .setTitle('Command Usage Log (Slash Command)')
        .setColor(0x0099FF)
        .addFields(
            { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'Command', value: command.data.name, inline: true },
            { name: 'Options', value: options, inline: false },
            { name: 'Guild', value: interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : 'DM', inline: true },
            { name: 'Channel', value: interaction.channel ? `${interaction.channel.name} (${interaction.channel.id})` : 'DM', inline: true },
            { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
        );
    return embed;
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    // Check permissions based on command category
    const memberRoles = interaction.member?.roles;
    
    // Moderation commands require moderator role
    const moderationCommands = ['ban', 'unban', 'kick', 'timeout', 'purge', 'purgeuser', 'slowmode', 'lock', 'unlock', 'warn', 'warnings', 'setnick'];
    if (moderationCommands.includes(interaction.commandName)) {
        if (MODERATOR_ROLE_IDS.length > 0 && !MODERATOR_ROLE_IDS.some(roleId => memberRoles?.cache.has(roleId))) {
            if (ADMIN_ROLE_IDS.length === 0 || !ADMIN_ROLE_IDS.some(roleId => memberRoles?.cache.has(roleId))) {
                await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                return;
            }
        }
    }
    
    // Admin commands require admin role
    const adminCommands = ['announce', 'command', 'logs', 'say', 'clearwarns'];
    if (adminCommands.includes(interaction.commandName)) {
        if (ADMIN_ROLE_IDS.length > 0 && !ADMIN_ROLE_IDS.some(roleId => memberRoles?.cache.has(roleId))) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }
    }

    // Giveaway commands require allowed roles
    if (interaction.commandName === 'giveaway' || interaction.commandName === 'giveaway-reroll') {
        if (ALLOWED_ROLE_IDS.length > 0 && !ALLOWED_ROLE_IDS.some(roleId => memberRoles?.cache.has(roleId))) {
            if (ADMIN_ROLE_IDS.length === 0 || !ADMIN_ROLE_IDS.some(roleId => memberRoles?.cache.has(roleId))) {
                await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                return;
            }
        }
    }

    try {
        await interaction.deferReply();
        await command.execute(interaction);
        // Send command usage log if logging channel is set
        const logChannelId = loggingChannelId || logsCommand.getLoggingChannelId();
        if (logChannelId && interaction.guild) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const embed = createLogEmbedForSlashCommand(interaction, command);
                logChannel.send({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error(`Error executing slash command ${interaction.commandName}:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'An error occurred while processing the command.', ephemeral: true });
        } else if (interaction.deferred) {
            await interaction.editReply({ content: 'An error occurred while processing the command.' });
        }
    }
});

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    if (input.trim().toLowerCase() === 'stop') {
        console.log('Stopping bot...');
        process.exit(0);
    }
});

client.login(DISCORD_TOKEN);
