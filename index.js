require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const messageCreateEvent = require('./events/messageCreate');
const { REST, Routes } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

const configStore = require('./configStore');
const { hasModeratorPermission, hasAdminPermission } = require('./utils/permissions');
const antiNuke = require('./utils/antiNuke');
const securityShield = require('./utils/securityShield');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const ALLOWED_ROLE_IDS = (process.env.ALLOWED_ROLE_IDS || '').split(',').map(r => r.trim()).filter(r => r.length > 0);
const MODERATOR_ROLE_IDS = (process.env.MODERATOR_ROLE_IDS || '').split(',').map(r => r.trim()).filter(r => r.length > 0);
const ADMIN_ROLE_IDS = (process.env.ADMIN_ROLE_IDS || '').split(',').map(r => r.trim()).filter(r => r.length > 0);

client.prefixCommands = new Collection();
client.slashCommands = new Collection();

const commandStatusFile = path.join(__dirname, 'data', 'commandStatus.json');
let commandStatus = {};

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
        if (command?.data && typeof command.data.setDefaultMemberPermissions === 'function') {
            command.data.setDefaultMemberPermissions(null);
        }
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
    
    // Register logging events
    const logger = require('./utils/logger');
    
    client.on('messageDelete', async (message) => {
        if (message.partial || message.author.bot) return;
        await logger.logMessageDelete(message);
        // Snipe system
        const snipe = require('./utils/snipe');
        snipe.addDeletedMessage(message);
    });
    
    client.on('messageUpdate', async (oldMessage, newMessage) => {
        if (oldMessage.partial || newMessage.partial || newMessage.author.bot) return;
        await logger.logMessageEdit(oldMessage, newMessage);
        // Edit snipe system
        const snipe = require('./utils/snipe');
        snipe.addEditedMessage(oldMessage, newMessage);
    });
    
    client.on('guildMemberAdd', async (member) => {
        await securityShield.handleMemberJoin(member);
        await logger.logMemberJoin(member);
        // Welcomer system
        const welcomer = require('./utils/welcomer');
        await welcomer.sendWelcomeMessage(member);
    });
    
    client.on('guildMemberRemove', async (member) => {
        await logger.logMemberLeave(member);
        // Goodbye message
        const welcomer = require('./utils/welcomer');
        await welcomer.sendGoodbyeMessage(member);
    });
    
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        await logger.logMemberUpdate(oldMember, newMember);
    });
    
    client.on('voiceStateUpdate', async (oldState, newState) => {
        await logger.logVoiceStateUpdate(oldState, newState);
    });
    
    client.on('channelUpdate', async (oldChannel, newChannel) => {
        await logger.logChannelUpdate(oldChannel, newChannel);
    });
    
    client.on('channelDelete', async (channel) => {
        await antiNuke.handleChannelDelete(channel);
    });
    
    client.on('channelCreate', async (channel) => {
        await antiNuke.handleChannelCreate(channel);
    });
    
    client.on('roleDelete', async (role) => {
        await antiNuke.handleRoleDelete(role);
    });
    
    client.on('roleCreate', async (role) => {
        await antiNuke.handleRoleCreate(role);
    });
    
    client.on('guildBanAdd', async (ban) => {
        await logger.logBan(ban);
    });
    
    client.on('guildBanRemove', async (ban) => {
        await logger.logUnban(ban);
    });
    
    // Register reaction role events
    const reactionRoleManager = require('./utils/reactionRoleManager');
    
    client.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot) return;
        
        // Fetch partial messages
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }
        
        await reactionRoleManager.handleReactionAdd(reaction, user, reaction.message.guild);
        
        // Starboard system
        const starboard = require('./utils/starboard');
        await starboard.handleStarAdd(reaction, user);
    });
    
    client.on('messageReactionRemove', async (reaction, user) => {
        if (user.bot) return;
        
        // Fetch partial messages
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }
        
        await reactionRoleManager.handleReactionRemove(reaction, user, reaction.message.guild);
        
        // Starboard system
        const starboard = require('./utils/starboard');
        await starboard.handleStarRemove(reaction, user);
    });
    
    // Start dashboard with bot (disable only if explicitly set to false)
    if (process.env.ENABLE_DASHBOARD !== 'false') {
        const { startDashboard } = require('./dashboard/server');
        startDashboard(client);
    }
});


client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefix = 'k!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.prefixCommands.get(commandName);
    if (!command) return;

    // Check permissions based on command category
    const moderationCommands = ['ban', 'unban', 'kick', 'timeout', 'purge', 'slowmode', 'lock', 'unlock', 'warn', 'warnings', 'setnick', 'removecase', 'removewarn', 'snipe', 'editsnipe'];
    const adminCommands = ['announce', 'command', 'clearwarns', 'logging', 'setuproles', 'setbotname', 'setbotavatar', 'ticket-setup', 'reactionrole', 'automod', 'starboard', 'welcomer', 'verify', 'tags', 'audit', 'antinuke', 'security', 'extraowners'];
    
    // Moderation commands require moderator or admin role
    if (moderationCommands.includes(commandName)) {
        if (!hasModeratorPermission(message.member, message.guild.id, message.author.id, message.guild.ownerId)) {
            message.channel.send('❌ You do not have permission to use this command. Only moderators, admins, server owner, and bot owner can use moderation commands.');
            return;
        }
    }
    
    // Admin commands require admin role
    if (adminCommands.includes(commandName)) {
        if (!hasAdminPermission(message.member, message.guild.id, message.author.id, message.guild.ownerId)) {
            message.channel.send('❌ You do not have permission to use this command. Only admins, server owner, and bot owner can use admin commands.');
            return;
        }
    }

    // Giveaway commands require allowed roles (keeping backward compatibility)
    if (commandName === 'giveaway') {
        const memberRoles = message.member?.roles.cache;
        if (ALLOWED_ROLE_IDS.length > 0 && !ALLOWED_ROLE_IDS.some(roleId => memberRoles?.has(roleId))) {
            if (!hasAdminPermission(message.member, message.guild.id, message.author.id, message.guild.ownerId)) {
                message.channel.send('❌ You do not have permission to use this command.');
                return;
            }
        }
    }

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(`Error executing prefix command ${commandName}:`, error);
        message.channel.send('An error occurred while executing the command.');
    }
});


client.on('interactionCreate', async interaction => {
    // Handle button interactions for tickets
    if (interaction.isButton()) {
        const { createTicket, closeTicket, claimTicket } = require('./utils/ticketManager');
        const { handleButtonRole } = require('./utils/reactionRoleManager');
        const { handleSuggestionVote } = require('./utils/suggestions');
        const { handleVerifyButton } = require('./utils/verification');
        
        if (interaction.customId === 'create_ticket') {
            await interaction.deferReply({ ephemeral: true });
            const result = await createTicket(interaction.guild, interaction.user);
            
            if (result.success) {
                await interaction.editReply({ 
                    content: `✅ Ticket created! ${result.channel}`,
                    ephemeral: true 
                });
            } else {
                await interaction.editReply({ 
                    content: `❌ ${result.error}`,
                    ephemeral: true 
                });
            }
            return;
        }
        
        if (interaction.customId.startsWith('ticket_close_')) {
            await interaction.deferReply();
            const result = await closeTicket(interaction.channel, interaction.user);
            
            if (!result.success) {
                await interaction.editReply({ content: `❌ ${result.error}` });
            }
            return;
        }
        
        if (interaction.customId.startsWith('ticket_claim_')) {
            await interaction.deferReply();
            const result = await claimTicket(interaction.channel, interaction.user);
            
            if (!result.success) {
                await interaction.editReply({ content: `❌ ${result.error}`, ephemeral: true });
            } else {
                await interaction.editReply({ content: '✅ Ticket claimed!' });
            }
            return;
        }
        
        // Handle reaction role buttons
        if (interaction.customId.startsWith('role_')) {
            const roleId = interaction.customId.split('_')[1];
            await handleButtonRole(interaction, roleId);
            return;
        }

        // Handle suggestion voting buttons
        if (interaction.customId.startsWith('suggestion_')) {
            await handleSuggestionVote(interaction);
            return;
        }

        // Handle verification button
        if (interaction.customId === 'verify_member') {
            await handleVerifyButton(interaction);
            return;
        }
    }
    
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    // Check permissions based on command category
    const moderationCommands = ['ban', 'unban', 'kick', 'timeout', 'purge', 'slowmode', 'lock', 'unlock', 'warn', 'warnings', 'setnick', 'removecase', 'removewarn', 'snipe', 'editsnipe'];
    const adminCommands = ['announce', 'command', 'logs', 'clearwarns', 'logging', 'setuproles', 'setbotname', 'setbotavatar', 'ticket-setup', 'reactionrole', 'automod', 'starboard', 'welcomer', 'verify', 'tags', 'audit', 'antinuke', 'security', 'extraowners'];
    
    // Moderation commands require moderator or admin role
    if (moderationCommands.includes(interaction.commandName)) {
        if (!hasModeratorPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
            await interaction.reply({ content: '❌ You do not have permission to use this command. Only moderators, admins, server owner, and bot owner can use moderation commands.', ephemeral: true });
            return;
        }
    }
    
    // Admin commands require admin role
    if (adminCommands.includes(interaction.commandName)) {
        if (!hasAdminPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
            await interaction.reply({ content: '❌ You do not have permission to use this command. Only admins, server owner, and bot owner can use admin commands.', ephemeral: true });
            return;
        }
    }

    // Giveaway commands require allowed roles (keeping backward compatibility)
    if (interaction.commandName === 'giveaway' || interaction.commandName === 'giveaway-reroll') {
        const memberRoles = interaction.member?.roles;
        if (ALLOWED_ROLE_IDS.length > 0 && !ALLOWED_ROLE_IDS.some(roleId => memberRoles?.cache.has(roleId))) {
            if (!hasAdminPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                await interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
                return;
            }
        }
    }

    try {
        await interaction.deferReply();
        await command.execute(interaction);
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
