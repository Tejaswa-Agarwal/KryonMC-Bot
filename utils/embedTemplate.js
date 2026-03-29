const { EmbedBuilder } = require('discord.js');

/**
 * Create a standardized embed with consistent styling
 */
class EmbedTemplate {
    /**
     * Success embed (green)
     */
    static success(title, description, fields = []) {
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(`✅ ${title}`)
            .setTimestamp();
        
        if (description) embed.setDescription(description);
        if (fields.length > 0) embed.addFields(fields);
        
        return embed;
    }

    /**
     * Error embed (red)
     */
    static error(title, description) {
        return new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`❌ ${title}`)
            .setDescription(description)
            .setTimestamp();
    }

    /**
     * Warning embed (orange)
     */
    static warning(title, description, fields = []) {
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle(`⚠️ ${title}`)
            .setTimestamp();
        
        if (description) embed.setDescription(description);
        if (fields.length > 0) embed.addFields(fields);
        
        return embed;
    }

    /**
     * Info embed (blue)
     */
    static info(title, description, fields = []) {
        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle(`ℹ️ ${title}`)
            .setTimestamp();
        
        if (description) embed.setDescription(description);
        if (fields.length > 0) embed.addFields(fields);
        
        return embed;
    }

    /**
     * Moderation action embed (dark red)
     */
    static modAction(action, moderator, target, reason, caseId = null) {
        const actionEmojis = {
            ban: '🔨',
            unban: '✅',
            kick: '👢',
            timeout: '⏱️',
            warn: '⚠️',
            purge: '🧹'
        };

        const embed = new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle(`${actionEmojis[action] || '🛡️'} ${action.charAt(0).toUpperCase() + action.slice(1)}`)
            .addFields(
                { name: 'Target', value: `${target.tag || target}\n\`${target.id || 'N/A'}\``, inline: true },
                { name: 'Moderator', value: `${moderator.tag}\n\`${moderator.id}\``, inline: true },
                { name: 'Reason', value: reason || 'No reason provided' }
            )
            .setThumbnail(target.displayAvatarURL ? target.displayAvatarURL() : null)
            .setTimestamp()
            .setFooter({ text: `Moderator: ${moderator.tag}`, iconURL: moderator.displayAvatarURL() });

        if (caseId) {
            embed.addFields({ name: 'Case ID', value: `#${caseId}`, inline: true });
        }

        return embed;
    }

    /**
     * User info embed
     */
    static userInfo(member) {
        const user = member.user;
        const roles = member.roles.cache
            .filter(role => role.id !== member.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .slice(0, 10)
            .join(', ') || 'None';

        const embed = new EmbedBuilder()
            .setColor(member.displayHexColor || '#0099FF')
            .setTitle(`👤 User Information`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: '🏷️ Username', value: user.tag, inline: true },
                { name: '🆔 User ID', value: user.id, inline: true },
                { name: '🎨 Nickname', value: member.nickname || 'None', inline: true },
                { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '🎭 Roles', value: roles.substring(0, 1024) }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${user.tag}`, iconURL: user.displayAvatarURL() });

        if (member.premiumSince) {
            embed.addFields({ 
                name: '💎 Boosting', 
                value: `Since <t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>`, 
                inline: true 
            });
        }

        return embed;
    }

    /**
     * Server info embed
     */
    static serverInfo(guild) {
        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle(`🏰 ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: '🆔 Server ID', value: guild.id, inline: true },
                { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
                { name: '💬 Channels', value: `${guild.channels.cache.size}`, inline: true },
                { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: '😊 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
                { name: '💎 Boost Level', value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
                { name: '🔒 Verification', value: guild.verificationLevel.toString(), inline: true }
            )
            .setTimestamp();

        if (guild.banner) {
            embed.setImage(guild.bannerURL({ size: 1024 }));
        }

        return embed;
    }

    /**
     * Help command category embed
     */
    static helpCategory(category, commands, color = '#0099FF') {
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`📚 ${category}`)
            .setDescription(commands.map(cmd => `\`/${cmd.name}\` - ${cmd.description}`).join('\n'))
            .setTimestamp();

        return embed;
    }

    /**
     * Generic custom embed builder
     */
    static custom(options = {}) {
        const embed = new EmbedBuilder();

        if (options.color) embed.setColor(options.color);
        if (options.title) embed.setTitle(options.title);
        if (options.description) embed.setDescription(options.description);
        if (options.fields) embed.addFields(options.fields);
        if (options.thumbnail) embed.setThumbnail(options.thumbnail);
        if (options.image) embed.setImage(options.image);
        if (options.footer) embed.setFooter(options.footer);
        if (options.timestamp) embed.setTimestamp();
        if (options.author) embed.setAuthor(options.author);
        if (options.url) embed.setURL(options.url);

        return embed;
    }
}

module.exports = EmbedTemplate;
