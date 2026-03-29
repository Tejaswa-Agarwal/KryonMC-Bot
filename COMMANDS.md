# Axion Bot - Command Reference

Complete documentation for all bot commands and features.

---

## 🛡️ Moderation Commands

### `/ban`
Ban a user from the server with optional message deletion.

**Usage:**
```
/ban user:@User reason:Spamming delete-days:7
```

**Parameters:**
- `user` (required): User to ban
- `reason` (optional): Reason for ban
- `delete-days` (optional): Delete messages from last 0-7 days

**Permissions:** Moderator or Admin role  
**Features:** Role hierarchy checks, DM notification, case tracking, mod logging

---

### `/unban`
Unban a previously banned user.

**Usage:**
```
/unban userid:123456789 reason:Appeal accepted
```

**Parameters:**
- `userid` (required): Discord user ID to unban
- `reason` (optional): Reason for unban

**Permissions:** Moderator or Admin role  
**Features:** Case tracking, mod logging

---

### `/kick`
Remove a user from the server.

**Usage:**
```
/kick user:@User reason:Breaking rules
```

**Parameters:**
- `user` (required): User to kick
- `reason` (optional): Reason for kick

**Permissions:** Moderator or Admin role  
**Features:** Role hierarchy checks, DM notification, case tracking, mod logging

---

### `/timeout`
Temporarily mute a user (max 28 days).

**Usage:**
```
/timeout user:@User duration:1h reason:Spam
```

**Parameters:**
- `user` (required): User to timeout
- `duration` (required): Duration (10s, 5m, 1h, 7d, etc.)
- `reason` (optional): Reason for timeout

**Permissions:** Moderator or Admin role  
**Features:** Role hierarchy checks, DM notification with duration, case tracking, mod logging

---

### `/warn`
Issue a warning to a user with tracking.

**Usage:**
```
/warn user:@User reason:Please read the rules
```

**Parameters:**
- `user` (required): User to warn
- `reason` (required): Reason for warning

**Permissions:** Moderator or Admin role  
**Features:** Warning counter, unique warning ID, DM notification, case tracking, mod logging

---

### `/warnings`
View all warnings for a user or yourself.

**Usage:**
```
/warnings user:@User
/warnings
```

**Parameters:**
- `user` (optional): User to view warnings for (defaults to self)

**Permissions:** Everyone (can view own warnings), Moderator+ (can view others)  
**Features:** Shows all warnings with IDs, timestamps, and moderators

---

### `/clearwarns`
Clear all warnings for a user.

**Usage:**
```
/clearwarns user:@User reason:Clean slate
```

**Parameters:**
- `user` (required): User to clear warnings for
- `reason` (optional): Reason for clearing

**Permissions:** Admin role  
**Features:** Permanent deletion, case tracking, mod logging

---

### `/removewarn`
Remove a specific warning by ID.

**Usage:**
```
/removewarn warnid:1710012345678
```

**Parameters:**
- `warnid` (required): Warning ID to remove

**Permissions:** Admin role  
**Features:** Specific warning removal, case tracking

---

### `/purge`
Bulk delete messages (up to 100).

**Usage:**
```
/purge amount:50 user:@User reason:Spam cleanup
```

**Parameters:**
- `amount` (required): Number of messages (1-100)
- `user` (optional): Only delete messages from this user
- `reason` (optional): Reason for purge

**Permissions:** Moderator or Admin role  
**Features:** User filtering, reason tracking, case logging, mod logging  
**Note:** Messages older than 14 days cannot be deleted (Discord limitation)

---

### `/slowmode`
Set slowmode delay for a channel.

**Usage:**
```
/slowmode duration:10s
```

**Parameters:**
- `duration` (required): Slowmode delay (0s to disable, max 6h)

**Permissions:** Moderator or Admin role  
**Features:** Human-readable durations, mod logging

---

### `/lock`
Lock a channel (prevent @everyone from sending messages).

**Usage:**
```
/lock reason:Under maintenance
```

**Parameters:**
- `reason` (optional): Reason for locking

**Permissions:** Moderator or Admin role  
**Features:** Permission management, mod logging

---

### `/unlock`
Unlock a previously locked channel.

**Usage:**
```
/unlock
```

**Permissions:** Moderator or Admin role  
**Features:** Permission restoration, mod logging

---

### `/setnick`
Change a user's nickname.

**Usage:**
```
/setnick user:@User nickname:NewName
```

**Parameters:**
- `user` (required): User to rename
- `nickname` (required): New nickname

**Permissions:** Moderator or Admin role  
**Features:** Role hierarchy checks, mod logging

---

## 📋 Case Management

### `/cases`
View all moderation cases for a user.

**Usage:**
```
/cases user:@User
```

**Parameters:**
- `user` (required): User to view cases for

**Permissions:** Moderator or Admin role  
**Features:** Complete case history with case IDs, types, moderators, reasons

---

### `/removecase`
Remove a specific case by ID.

**Usage:**
```
/removecase caseid:42
```

**Parameters:**
- `caseid` (required): Case ID to remove

**Permissions:** Admin role  
**Features:** Permanent case deletion

---

## 🎫 Ticket System

### `/ticket-setup`
Configure the ticket system for your server.

**Usage:**
```
/ticket-setup category:Support support-role:@Support
```

**Parameters:**
- `category` (required): Category to create tickets in
- `support-role` (required): Role that can view/manage tickets

**Permissions:** Admin role  
**Features:** Creates button interface, configures permissions

---

### `/ticket create`
Create a support ticket (appears as button to users).

**Features:**
- Private channel created in ticket category
- Only ticket creator and support team can view
- Automatic numbering (ticket-1, ticket-2, etc.)

---

### `/ticket close`
Close the current ticket and generate transcript.

**Features:**
- Saves complete chat history to `data/transcripts/`
- Deletes ticket channel
- Transcript includes all messages with timestamps

---

### `/ticket add`
Add a user to the current ticket.

**Usage:**
```
/ticket add user:@User
```

**Parameters:**
- `user` (required): User to add to ticket

**Permissions:** Support team  
**Features:** Grants read/send message permissions

---

### `/ticket remove`
Remove a user from the current ticket.

**Usage:**
```
/ticket remove user:@User
```

**Parameters:**
- `user` (required): User to remove from ticket

**Permissions:** Support team  
**Features:** Revokes ticket access

---

## 🎨 Reaction Roles

### `/reactionrole create`
Create a new reaction role message.

**Usage:**
```
/reactionrole create mode:button type:unique
```

**Parameters:**
- `mode` (required): `button` or `reaction`
- `type` (required): `normal` (multiple roles) or `unique` (one role only)

**Permissions:** Admin role  
**Features:** Button or emoji-based, unique or multiple selection

---

### `/reactionrole add`
Add a role to an existing reaction role message.

**Usage:**
```
/reactionrole add message-id:123456 role:@Role emoji:✅ label:Accept Rules
```

**Parameters:**
- `message-id` (required): Message ID to add role to
- `role` (required): Role to assign
- `emoji` (optional): Emoji for reaction mode
- `label` (optional): Button label for button mode

**Permissions:** Admin role  
**Features:** Up to 25 roles per message

---

### `/reactionrole remove`
Remove a role from a reaction role message.

**Usage:**
```
/reactionrole remove message-id:123456 role:@Role
```

**Parameters:**
- `message-id` (required): Message ID
- `role` (required): Role to remove

**Permissions:** Admin role

---

### `/reactionrole delete`
Delete an entire reaction role setup.

**Usage:**
```
/reactionrole delete message-id:123456
```

**Parameters:**
- `message-id` (required): Message ID to delete

**Permissions:** Admin role  
**Features:** Removes configuration and deletes message

---

## 📊 Advanced Logging

### `/logging setup`
Configure logging channels.

**Usage:**
```
/logging setup message-log:#logs member-log:#logs mod-log:#mod-logs
```

**Parameters:**
- `message-log` (optional): Channel for message edits/deletes
- `member-log` (optional): Channel for joins/leaves/updates
- `voice-log` (optional): Channel for voice activity
- `mod-log` (optional): Channel for mod actions
- `server-log` (optional): Channel for server changes

**Permissions:** Admin role  
**Features:** 5 separate log categories, rich embeds with details

---

### `/logging view`
View current logging configuration.

**Permissions:** Admin role

---

### `/logging disable`
Disable a specific log category.

**Usage:**
```
/logging disable category:message-log
```

**Parameters:**
- `category` (required): Category to disable

**Permissions:** Admin role

---

## 🛡️ Enhanced Automod

### `/automod enable`
Enable or disable the automod system.

**Usage:**
```
/automod enable enabled:True
```

**Parameters:**
- `enabled` (required): True or False

**Permissions:** Admin role

---

### `/automod config`
View current automod configuration.

**Permissions:** Admin role  
**Features:** Shows all filter statuses, thresholds, and punishments

---

### `/automod antispam`
Configure spam detection.

**Usage:**
```
/automod antispam enabled:True threshold:5 punishment:timeout
```

**Parameters:**
- `enabled` (required): Enable/disable
- `threshold` (optional): Messages in 5 seconds (default: 5)
- `punishment` (optional): warn, timeout, kick, or ban

**Permissions:** Admin role  
**Features:** Time-based message tracking, automatic cleanup

---

### `/automod antiinvite`
Block Discord invite links.

**Usage:**
```
/automod antiinvite enabled:True punishment:kick
```

**Parameters:**
- `enabled` (required): Enable/disable
- `punishment` (optional): Action to take

**Permissions:** Admin role  
**Features:** Detects discord.gg and discord.com/invite links

---

### `/automod anticaps`
Limit excessive capital letters.

**Usage:**
```
/automod anticaps enabled:True threshold:70
```

**Parameters:**
- `enabled` (required): Enable/disable
- `threshold` (optional): Max % of caps (default: 70)

**Permissions:** Admin role

---

### `/automod antimassmention`
Prevent mass mentions.

**Usage:**
```
/automod antimassmention enabled:True threshold:5 punishment:timeout
```

**Parameters:**
- `enabled` (required): Enable/disable
- `threshold` (optional): Max mentions (default: 5)
- `punishment` (optional): Action to take

**Permissions:** Admin role

---

### `/automod antiemojispam`
Limit emoji spam.

**Usage:**
```
/automod antiemojispam enabled:True threshold:10
```

**Parameters:**
- `enabled` (required): Enable/disable
- `threshold` (optional): Max emojis per message (default: 10)

**Permissions:** Admin role

---

### `/automod customwords`
Block custom words/phrases.

**Usage:**
```
/automod customwords action:add word:badword
/automod customwords action:list
```

**Parameters:**
- `action` (required): add, remove, list, or enable
- `word` (optional): Word to add/remove

**Permissions:** Admin role  
**Features:** Custom word list, case-insensitive matching

---

### `/automod whitelist`
Exempt roles from automod.

**Usage:**
```
/automod whitelist action:add role:@Trusted
/automod whitelist action:list
```

**Parameters:**
- `action` (required): add, remove, or list
- `role` (optional): Role to add/remove

**Permissions:** Admin role  
**Features:** Moderators automatically exempt

---

## 🔧 Utility Commands

### `/help`
Display all available commands organized by category.

**Permissions:** Everyone  
**Features:** 35 commands across 9 categories, clean embed formatting

---

### `/ping`
Check bot latency and response time.

**Permissions:** Everyone  
**Features:** Shows bot latency, API latency, uptime

---

### `/avatar`
Display a user's avatar in high resolution.

**Usage:**
```
/avatar user:@User
/avatar
```

**Parameters:**
- `user` (optional): User to show avatar for (defaults to self)

**Permissions:** Everyone  
**Features:** 1024x1024 resolution, download link

---

### `/userinfo`
Show detailed information about a user.

**Usage:**
```
/userinfo user:@User
/userinfo
```

**Parameters:**
- `user` (optional): User to show info for (defaults to self)

**Permissions:** Everyone  
**Features:** Join date, account creation, roles, status, avatar

---

### `/serverinfo`
Display comprehensive server statistics.

**Permissions:** Everyone  
**Features:** Member counts, channel counts, role list, server boosts, creation date

---

## ⚙️ Admin Commands

### `/announce`
Send a formatted announcement.

**Usage:**
```
/announce channel:#general message:Important update! title:Announcement color:Blue ping-everyone:False
```

**Parameters:**
- `channel` (required): Channel to send to
- `message` (required): Announcement text
- `title` (optional): Embed title
- `color` (optional): Blue, Green, Red, Gold, Purple
- `ping-everyone` (optional): Ping @everyone (default: False)

**Permissions:** Admin role  
**Features:** Rich embeds, color options, optional ping with confirmation

---

### `/command`
Enable or disable commands per server.

**Usage:**
```
/command action:disable command:poll
/command action:enable command:poll
```

**Parameters:**
- `action` (required): enable or disable
- `command` (required): Command name

**Permissions:** Admin role  
**Features:** Per-guild command toggle, persistent across restarts

---

### `/logs`
Set the channel for command usage logs (deprecated - use `/logging setup` for mod-log).

**Usage:**
```
/logs channel:#logs
```

**Parameters:**
- `channel` (required): Log channel

**Permissions:** Admin role

---

### `/setuproles`
Configure moderator and admin roles.

**Usage:**
```
/setuproles moderator-role:@Moderator admin-role:@Admin
```

**Parameters:**
- `moderator-role` (optional): Moderator role
- `admin-role` (optional): Admin role

**Permissions:** Guild Owner or Bot Owner  
**Features:** Per-guild configuration, no interference between servers

---

### `/setbotname`
Set custom bot nickname for this server.

**Usage:**
```
/setbotname name:Support Bot
```

**Parameters:**
- `name` (required): New nickname

**Permissions:** Admin role  
**Features:** Per-guild customization

---

### `/setbotavatar`
Set custom bot avatar for this server (note: global change, rate-limited).

**Usage:**
```
/setbotavatar url:https://example.com/avatar.png
```

**Parameters:**
- `url` (required): Image URL

**Permissions:** Admin role  
**Note:** Changes bot avatar globally, rate-limited by Discord (~2 changes per 10 min)

---

## 🎮 Fun Commands

### `/8ball`
Ask the magic 8-ball a question.

**Usage:**
```
/8ball question:Will it rain tomorrow?
```

**Parameters:**
- `question` (required): Your yes/no question

**Permissions:** Everyone  
**Features:** Color-coded responses (green=positive, orange=uncertain, red=negative)

---

### `/poll`
Create a poll with up to 10 options.

**Usage:**
```
/poll question:Favorite color? option1:Red option2:Blue duration:60
```

**Parameters:**
- `question` (required): Poll question
- `option1-10` (required: at least 2): Poll options
- `duration` (optional): Auto-end duration in minutes (1-1440)

**Permissions:** Everyone  
**Features:** Emoji reactions, automatic results calculation, winner announcement

---

## 🎉 Giveaway Commands

### `/giveaway`
Create a giveaway with button-based entries.

**Usage:**
```
/giveaway duration:1h winners:1 prize:Discord Nitro
```

**Parameters:**
- `duration` (required): Giveaway duration (1h, 30m, 7d, etc.)
- `winners` (required): Number of winners
- `prize` (required): Prize description

**Permissions:** Admin role  
**Features:** Button-based entry, automatic winner selection, embed countdown

---

### `/giveaway-reroll`
Reroll a giveaway to select new winner(s).

**Usage:**
```
/giveaway-reroll message-id:123456789
```

**Parameters:**
- `message-id` (required): Original giveaway message ID

**Permissions:** Admin role  
**Features:** Selects new random winner from participants

---

## 🔑 Permission Hierarchy

1. **Bot Owner** (ID: `1124168034332975204`)
   - Full access to everything

2. **Guild Owner**
   - Full access in their server
   - Can configure roles with `/setuproles`

3. **Admin Role** (configured per-guild)
   - All moderation commands
   - All admin commands
   - System configuration

4. **Moderator Role** (configured per-guild)
   - Basic moderation (ban, kick, timeout, warn, purge)
   - Channel management (lock, slowmode, setnick)
   - View cases and warnings

5. **Everyone**
   - Utility commands
   - Fun commands
   - Self-service (view own warnings, create tickets)

---

## 📖 Special Formats

### Duration Format
Used in: timeout, poll, giveaway, automod, slowmode
```
10s  - 10 seconds
5m   - 5 minutes
2h   - 2 hours
7d   - 7 days
4w   - 4 weeks
```

### Color Options
Used in: announce
```
Blue, Green, Red, Gold, Purple
```

### Punishment Types
Used in: automod
```
warn    - Issue warning
timeout - Timeout for 1 hour
kick    - Kick from server
ban     - Ban from server
```

---

## 💡 Tips & Best Practices

1. **Configure roles first** with `/setuproles` after adding the bot
2. **Setup logging** with `/logging setup` to track all mod actions
3. **Enable automod** with `/automod enable` then configure filters
4. **Create ticket system** with `/ticket-setup` for user support
5. **Use warnings system** instead of immediately banning users
6. **Check cases** with `/cases` before taking action on repeat offenders
7. **Test commands** in a private channel before using in public
8. **Whitelist trusted roles** in automod to prevent false positives
9. **Set slowmode** in busy channels to prevent spam
10. **Use embeds** in announcements for professional appearance

---

## 🆘 Common Issues

**"Missing Permissions"**
- Check `/setuproles` is configured
- Verify you have the correct role
- Bot owner can always use commands

**"Cannot find user"**
- User may have left the server
- Check user ID is correct
- Use `/unban` with user ID for banned users

**"Cannot purge messages"**
- Messages older than 14 days cannot be bulk deleted (Discord limitation)
- Reduce the amount or delete manually

**"Ticket system not working"**
- Run `/ticket-setup` first
- Ensure bot has Manage Channels permission
- Check category exists and bot can access it

**"Automod not working"**
- Run `/automod enable enabled:True`
- Configure specific filters with `/automod antispam`, etc.
- Check if user has whitelisted role

---

**For support, create a ticket or check the README.md file.**
