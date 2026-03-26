const { EmbedBuilder } = require('discord.js');
const { removeCase } = require('../utils/caseManager');

module.exports = {
    name: 'removecase',
    description: 'Remove a specific case from the system',
    async execute(message, args) {
        if (!message.guild) {
            return message.channel.send('This command can only be used in a server.');
        }

        if (args.length < 1) {
            return message.channel.send('Usage: k!removecase <caseID>');
        }

        const caseId = parseInt(args[0]);
        if (isNaN(caseId)) {
            return message.channel.send('❌ Please provide a valid case ID number.');
        }

        const removed = removeCase(message.guild.id, caseId);

        if (removed) {
            const embed = new EmbedBuilder()
                .setTitle('✅ Case Removed')
                .setDescription(`Successfully removed **Case #${caseId}** from the system.`)
                .setColor(0x2ECC71)
                .setFooter({ text: `Removed by ${message.author.tag}` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        } else {
            message.channel.send(`❌ Case #${caseId} not found.`);
        }
    }
};
