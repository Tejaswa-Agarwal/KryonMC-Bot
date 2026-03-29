const { EmbedBuilder, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const configStore = require('../configStore');
const fs = require('fs');
const path = require('path');

const ticketTranscriptsPath = path.join(__dirname, '../data/transcripts');

// Ensure transcripts directory exists
if (!fs.existsSync(ticketTranscriptsPath)) {
    fs.mkdirSync(ticketTranscriptsPath, { recursive: true });
}

/**
 * Get ticket configuration for a guild
 */
function getTicketConfig(guildId) {
    const config = configStore.get('ticketConfig') || {};
    return config[guildId] || null;
}

/**
 * Set ticket configuration for a guild
 */
function setTicketConfig(guildId, config) {
    const allConfigs = configStore.get('ticketConfig') || {};
    allConfigs[guildId] = config;
    configStore.set('ticketConfig', allConfigs);
}

/**
 * Create a new ticket channel
 */
async function createTicket(guild, user, reason = 'No reason provided') {
    const config = getTicketConfig(guild.id);
    
    if (!config || !config.enabled) {
        return { success: false, error: 'Ticket system is not enabled on this server.' };
    }

    // Check if user already has an open ticket
    const openTickets = config.openTickets || {};
    const existingTicket = Object.values(openTickets).find(t => t.userId === user.id);
    
    if (existingTicket) {
        const channel = guild.channels.cache.get(existingTicket.channelId);
        return { success: false, error: `You already have an open ticket: ${channel}` };
    }

    // Increment ticket counter
    config.counter = (config.counter || 0) + 1;
    const ticketNumber = config.counter;

    try {
        // Create ticket channel
        const channel = await guild.channels.create({
            name: `ticket-${ticketNumber}`,
            type: ChannelType.GuildText,
            parent: config.categoryId,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                },
                ...(config.supportRoleIds || []).map(roleId => ({
                    id: roleId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                })),
            ],
        });

        // Create ticket embed
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(`Ticket #${ticketNumber}`)
            .setDescription(`Welcome ${user}!\n\nSupport staff will be with you shortly.\n\n**Reason:** ${reason}`)
            .setTimestamp()
            .setFooter({ text: `Ticket by ${user.tag}`, iconURL: user.displayAvatarURL() });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_close_${channel.id}`)
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒'),
                new ButtonBuilder()
                    .setCustomId(`ticket_claim_${channel.id}`)
                    .setLabel('Claim')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✋')
            );

        await channel.send({ 
            content: `${user} ${config.supportRoleIds ? config.supportRoleIds.map(id => `<@&${id}>`).join(' ') : ''}`,
            embeds: [embed], 
            components: [row] 
        });

        // Save ticket data
        if (!config.openTickets) config.openTickets = {};
        config.openTickets[channel.id] = {
            ticketNumber,
            userId: user.id,
            channelId: channel.id,
            createdAt: Date.now(),
            claimedBy: null,
            claimedAt: null,
            closedBy: null,
            closedAt: null,
            reason
        };
        
        setTicketConfig(guild.id, config);

        return { success: true, channel, ticketNumber };
    } catch (error) {
        console.error('Error creating ticket:', error);
        return { success: false, error: 'Failed to create ticket. Check bot permissions.' };
    }
}

/**
 * Close a ticket and save transcript
 */
async function closeTicket(channel, closedBy) {
    const guild = channel.guild;
    const config = getTicketConfig(guild.id);
    
    if (!config || !config.openTickets || !config.openTickets[channel.id]) {
        return { success: false, error: 'This is not a valid ticket channel.' };
    }

    const ticketData = config.openTickets[channel.id];

    try {
        // Generate transcript
        const messages = await channel.messages.fetch({ limit: 100 });
        const messageLines = messages.reverse().map(m => {
            const timestamp = new Date(m.createdTimestamp).toLocaleString();
            return `[${timestamp}] ${m.author.tag}: ${m.content}${m.attachments.size > 0 ? ` [Attachments: ${m.attachments.map(a => a.url).join(', ')}]` : ''}`;
        }).join('\n');

        const transcriptHeader = [
            `Ticket #${ticketData.ticketNumber}`,
            `Guild: ${guild.name} (${guild.id})`,
            `Opened by: ${ticketData.userId}`,
            `Claimed by: ${ticketData.claimedBy || 'Unclaimed'}`,
            `Created at: ${new Date(ticketData.createdAt).toISOString()}`,
            `Closed by: ${closedBy.tag} (${closedBy.id})`,
            `Closed at: ${new Date().toISOString()}`,
            `Reason: ${ticketData.reason || 'No reason provided'}`,
            '---'
        ].join('\n');
        const transcript = `${transcriptHeader}\n${messageLines}`;

        // Save transcript
        const transcriptFile = path.join(ticketTranscriptsPath, `ticket-${ticketData.ticketNumber}-${guild.id}.txt`);
        fs.writeFileSync(transcriptFile, transcript);

        // Send closing message
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Ticket Closing')
            .setDescription(`This ticket is being closed by ${closedBy}.\n\nChannel will be deleted in 5 seconds...`)
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        // Try to DM user with transcript
        try {
            const user = await guild.members.fetch(ticketData.userId);
            const dmEmbed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle(`Ticket #${ticketData.ticketNumber} Closed`)
                .setDescription(`Your ticket in **${guild.name}** has been closed.\n\n**Reason:** ${ticketData.reason}`)
                .setTimestamp();

            await user.send({ embeds: [dmEmbed], files: [transcriptFile] });
        } catch (error) {
            console.log('Could not DM user transcript:', error.message);
        }

        // Remove from open tickets
        ticketData.closedBy = closedBy.id;
        ticketData.closedAt = Date.now();
        delete config.openTickets[channel.id];
        setTicketConfig(guild.id, config);

        // Delete channel after delay
        setTimeout(async () => {
            try {
                await channel.delete();
            } catch (error) {
                console.error('Error deleting ticket channel:', error);
            }
        }, 5000);

        return { success: true, ticketNumber: ticketData.ticketNumber };
    } catch (error) {
        console.error('Error closing ticket:', error);
        return { success: false, error: 'Failed to close ticket.' };
    }
}

/**
 * Claim a ticket
 */
async function claimTicket(channel, claimer) {
    const config = getTicketConfig(channel.guild.id);
    
    if (!config || !config.openTickets || !config.openTickets[channel.id]) {
        return { success: false, error: 'This is not a valid ticket channel.' };
    }

    const ticketData = config.openTickets[channel.id];
    
    if (ticketData.claimedBy) {
        return { success: false, error: 'This ticket has already been claimed.' };
    }

    ticketData.claimedBy = claimer.id;
    ticketData.claimedAt = Date.now();
    setTicketConfig(channel.guild.id, config);

    const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setDescription(`🎫 Ticket claimed by ${claimer}`)
        .setTimestamp();

    await channel.send({ embeds: [embed] });

    return { success: true, claimedBy: claimer.id };
}

/**
 * Add a user to a ticket
 */
async function addUserToTicket(channel, user) {
    try {
        await channel.permissionOverwrites.create(user, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(`✅ ${user} has been added to the ticket`)
            .setTimestamp();

        await channel.send({ embeds: [embed] });
        return { success: true };
    } catch (error) {
        console.error('Error adding user to ticket:', error);
        return { success: false, error: 'Failed to add user to ticket.' };
    }
}

/**
 * Remove a user from a ticket
 */
async function removeUserFromTicket(channel, user) {
    try {
        await channel.permissionOverwrites.delete(user);

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`❌ ${user} has been removed from the ticket`)
            .setTimestamp();

        await channel.send({ embeds: [embed] });
        return { success: true };
    } catch (error) {
        console.error('Error removing user from ticket:', error);
        return { success: false, error: 'Failed to remove user from ticket.' };
    }
}

module.exports = {
    getTicketConfig,
    setTicketConfig,
    createTicket,
    closeTicket,
    claimTicket,
    addUserToTicket,
    removeUserFromTicket
};
