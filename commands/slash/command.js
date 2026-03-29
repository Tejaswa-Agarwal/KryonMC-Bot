const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

const fs = require('fs');
const path = require('path');
const { hasAdminPermission } = require('../../utils/permissions');

const commandStatusFile = path.join(__dirname, '..', '..', 'data', 'commandStatus.json');
let commandStatus = {};

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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('command')
        .setDescription('Enable or disable bot commands')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Enable or disable a command')
                .setRequired(true)
                .addChoices(
                    { name: 'enable', value: 'enable' },
                    { name: 'disable', value: 'disable' }
                ))
        .addStringOption(option =>
            option.setName('commandname')
                .setDescription('The command to enable or disable')
                .setRequired(true)),
    async execute(interaction) {
        if (!hasAdminPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
            return interaction.editReply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const action = interaction.options.getString('action');
        const cmdName = interaction.options.getString('commandname').toLowerCase();

        loadCommandStatus();

        commandStatus[cmdName] = (action === 'enable');
        saveCommandStatus();

        await interaction.editReply({ content: `✅ Command "${cmdName}" has been ${action}d.` });
    }
};
