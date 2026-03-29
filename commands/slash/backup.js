const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { hasAdminPermission } = require('../../utils/permissions');
const { createGuildBackup, listGuildBackups, restoreGuildBackup } = require('../../utils/guildBackup');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Per-guild config backup and restore')
        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('Create a backup snapshot'))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List latest backups'))
        .addSubcommand(sub =>
            sub.setName('restore')
                .setDescription('Restore backup by ID')
                .addStringOption(option =>
                    option.setName('id')
                        .setDescription('Backup ID')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.editReply({ content: '❌ This command can only be used in a server.', ephemeral: true });
            return;
        }

        if (!hasAdminPermission(interaction.member, interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
            await interaction.editReply({ content: '❌ Only admins can manage backups.', ephemeral: true });
            return;
        }

        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'create') {
            const created = createGuildBackup(guildId, interaction.user.id);
            await interaction.editReply({ content: `✅ Backup created: \`${created.id}\`` });
            return;
        }

        if (sub === 'list') {
            const backups = listGuildBackups(guildId).slice(0, 10);
            if (!backups.length) {
                await interaction.editReply({ content: 'No backups found.' });
                return;
            }
            const text = backups.map(b => `• \`${b.id}\` • <t:${Math.floor((b.createdAt || 0) / 1000)}:R>`).join('\n');
            await interaction.editReply({ content: `**Latest Backups**\n${text}` });
            return;
        }

        const backupId = interaction.options.getString('id');
        const restored = restoreGuildBackup(guildId, backupId);
        if (!restored) {
            await interaction.editReply({ content: '❌ Backup ID not found.', ephemeral: true });
            return;
        }
        await interaction.editReply({ content: `✅ Restored backup: \`${restored.id}\`` });
    }
};
