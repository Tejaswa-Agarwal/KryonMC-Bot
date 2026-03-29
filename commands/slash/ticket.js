const { SlashCommandBuilder } = require('discord.js');
const { createTicket } = require('../../utils/ticketManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket management commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new support ticket')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for opening the ticket')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close the current ticket'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Claim the current ticket')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const reason = interaction.options.getString('reason') || 'No reason provided';
            
            const result = await createTicket(interaction.guild, interaction.user, reason);
            
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
        } else if (subcommand === 'close') {
            const { closeTicket, getTicketConfig } = require('../../utils/ticketManager');
            const config = getTicketConfig(interaction.guild.id);
            
            if (!config || !config.openTickets || !config.openTickets[interaction.channel.id]) {
                await interaction.editReply({ 
                    content: '❌ This command can only be used in a ticket channel.',
                    ephemeral: true 
                });
                return;
            }

            // Check if user has permission (ticket owner or support staff)
            const ticketData = config.openTickets[interaction.channel.id];
            const isTicketOwner = ticketData.userId === interaction.user.id;
            const { hasModeratorPermission } = require('../../utils/permissions');
            const isModerator = hasModeratorPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId);

            if (!isTicketOwner && !isModerator) {
                await interaction.editReply({ 
                    content: '❌ Only the ticket owner or support staff can close this ticket.',
                    ephemeral: true 
                });
                return;
            }

            await interaction.editReply({ content: '🔒 Closing ticket...' });
            await closeTicket(interaction.channel, interaction.user);
        } else if (subcommand === 'claim') {
            const { claimTicket, getTicketConfig } = require('../../utils/ticketManager');
            const { hasModeratorPermission } = require('../../utils/permissions');
            if (!hasModeratorPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                await interaction.editReply({
                    content: '❌ Only moderators can claim tickets.',
                    ephemeral: true
                });
                return;
            }

            const config = getTicketConfig(interaction.guild.id);
            if (!config || !config.openTickets || !config.openTickets[interaction.channel.id]) {
                await interaction.editReply({
                    content: '❌ This command can only be used in a ticket channel.',
                    ephemeral: true
                });
                return;
            }

            const result = await claimTicket(interaction.channel, interaction.user);
            if (!result.success) {
                await interaction.editReply({ content: `❌ ${result.error}`, ephemeral: true });
                return;
            }
            await interaction.editReply({ content: `✅ Ticket claimed by ${interaction.user}.` });
        } else if (subcommand === 'add') {
            const { addUserToTicket, getTicketConfig } = require('../../utils/ticketManager');
            const { hasModeratorPermission } = require('../../utils/permissions');
            
            // Check if user has moderator permission
            if (!hasModeratorPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                await interaction.editReply({ 
                    content: '❌ Only moderators can add users to tickets.',
                    ephemeral: true 
                });
                return;
            }

            const config = getTicketConfig(interaction.guild.id);
            if (!config || !config.openTickets || !config.openTickets[interaction.channel.id]) {
                await interaction.editReply({ 
                    content: '❌ This command can only be used in a ticket channel.',
                    ephemeral: true 
                });
                return;
            }

            const user = interaction.options.getUser('user');
            const result = await addUserToTicket(interaction.channel, user);
            
            if (result.success) {
                await interaction.editReply({ content: `✅ Added ${user} to the ticket.` });
            } else {
                await interaction.editReply({ content: `❌ ${result.error}`, ephemeral: true });
            }
        } else if (subcommand === 'remove') {
            const { removeUserFromTicket, getTicketConfig } = require('../../utils/ticketManager');
            const { hasModeratorPermission } = require('../../utils/permissions');
            
            // Check if user has moderator permission
            if (!hasModeratorPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                await interaction.editReply({ 
                    content: '❌ Only moderators can remove users from tickets.',
                    ephemeral: true 
                });
                return;
            }

            const config = getTicketConfig(interaction.guild.id);
            if (!config || !config.openTickets || !config.openTickets[interaction.channel.id]) {
                await interaction.editReply({ 
                    content: '❌ This command can only be used in a ticket channel.',
                    ephemeral: true 
                });
                return;
            }

            const user = interaction.options.getUser('user');
            const result = await removeUserFromTicket(interaction.channel, user);
            
            if (result.success) {
                await interaction.editReply({ content: `✅ Removed ${user} from the ticket.` });
            } else {
                await interaction.editReply({ content: `❌ ${result.error}`, ephemeral: true });
            }
        }
    }
};
