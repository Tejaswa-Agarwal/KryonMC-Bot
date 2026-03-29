# BloxMC Discord Bot

A comprehensive, enterprise-ready Discord moderation and utility bot with advanced features including tickets, reaction roles, logging, and automod systems.

## ✨ Key Features

### 🛡️ Advanced Moderation
- **Role-Based Permissions**: Configurable mod/admin roles per guild
- **Comprehensive Mod Tools**: Ban, kick, timeout, warn with case tracking
- **Warning System**: Track, view, and manage user warnings
- **Message Management**: Bulk delete with optional user filtering
- **Channel Controls**: Lock, unlock, slowmode, nickname management
- **Mod Action Logging**: All actions logged with case IDs

### 🎫 Ticket System
- **Button-Based Creation**: Users create tickets via button interactions
- **Ticket Management**: Close, claim, add/remove users
- **Transcript Generation**: Complete chat history saved on close
- **Role-Based Support**: Assign support team roles

### 🎨 Reaction Roles
- **Multiple Modes**: Button-based or emoji reactions
- **Unique/Normal Selection**: Allow multiple roles or restrict to one
- **Easy Setup**: Configure up to 25 roles per message
- **Flexible Management**: Add, remove, or delete configurations

### 📊 Advanced Logging
- **5 Log Categories**: Messages, members, voice, moderation, server changes
- **Comprehensive Tracking**: All events logged with detailed embeds
- **Configurable**: Enable specific log types per guild
- **Audit Integration**: Captures moderator info from audit logs

### 🛡️ Enhanced Automod
- **6 Filter Types**: Spam, invites, caps, mass mentions, emoji spam, custom words
- **Smart Detection**: Configurable thresholds and whitelist system
- **Auto-Punishment**: Warn, timeout, kick, or ban automatically
- **Mod Exemption**: Moderators bypass all filters

### 🎮 Fun & Engagement
- **8Ball**: Color-coded fortune telling
- **Polls**: Duration-based with automatic results
- **Giveaways**: Button-based entry with automatic winner selection

## 📋 Command List (41 Commands)

### 🛡️ Moderation (13)
`/ban` `/unban` `/kick` `/timeout` `/warn` `/warnings` `/removewarn` `/clearwarns` `/cases` `/removecase` `/purge` `/slowmode` `/lock` `/unlock` `/setnick` `/snipe` `/editsnipe`

### 🎫 Tickets (2)
`/ticket-setup` `/ticket` (create, close, add, remove)

### 🎨 Reaction Roles (1)
`/reactionrole` (create, add, remove, delete)

### 📊 Logging (1)
`/logging` (setup, view, disable)

### 🛡️ Automod (1)
`/automod` (enable, config, antispam, anticaps, punishment, whitelist)

### 🔧 Utility (6)
`/help` `/ping` `/avatar` `/userinfo` `/serverinfo` `/warnings` `/afk` `/suggest`

### ⚙️ Admin (6)
`/announce` `/command` `/logs` `/setuproles` `/setbotname` `/setbotavatar` `/welcomer` `/starboard` `/verify` `/tags` `/notes`

### 🎮 Fun (2)
`/8ball` `/poll`

### 🎉 Giveaways (2)
`/giveaway` `/giveaway-reroll`



### 🌟 New Community Features
- **Starboard**: Showcase top messages with ⭐ reaction thresholds
- **Welcomer**: Custom welcome/goodbye messages with placeholders and auto-role
- **Suggestions**: Public suggestion board with upvote/downvote buttons
- **AFK**: Set AFK reason and auto-reply when mentioned
- **Staff Notes**: Internal moderation notes per user
- **Tags**: Reusable custom server responses
- **Verification**: Button-based member verification role assignment

### 📊 Dashboard (MVP)
- Discord OAuth login flow scaffolded
- Server list + management pages scaffolded
- REST API for guild configuration reads/writes
- Ready for domain later (set callback URL in env)
## 🚀 Quick Start

### Prerequisites
- Node.js 16.9.0 or higher
- Discord Bot Token ([Create one](https://discord.com/developers/applications))

### Installation

```bash
# Clone repository
git clone https://github.com/Tejaswa-Agarwal/KryonMC-Bot.git
cd BloxMC-Bot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your bot token

# Start bot
npm start
```

### Configuration

Create a `.env` file:
```env
DISCORD_TOKEN=your_bot_token_here
ENABLE_DASHBOARD=true  # optional, defaults to enabled
DASHBOARD_HOST=0.0.0.0
DASHBOARD_PORT=25575

# For production dashboard login
DISCORD_CLIENT_ID=your_discord_app_client_id
DISCORD_CLIENT_SECRET=your_discord_app_client_secret
DASHBOARD_CALLBACK=https://your-domain.com/callback

# Optional bootstrap mode (disable once OAuth works)
# DASHBOARD_NO_AUTH=true
```

### Initial Setup Commands

Once the bot is online, run these in your Discord server:

```bash
# Set up mod/admin roles (required for permissions)
/setuproles

# Optional: Configure advanced features
/ticket-setup
/logging setup
/automod enable
```

## 🔑 Permission System

The bot uses a hierarchical permission system:

1. **Bot Owner** (hardcoded ID: `1124168034332975204`)
   - Full access to all commands
   
2. **Guild Owner**
   - Full access to all commands in their server

3. **Admin Role** (configured via `/setuproles`)
   - All moderation commands
   - All admin commands
   - System configuration

4. **Moderator Role** (configured via `/setuproles`)
   - Basic moderation (ban, kick, timeout, warn)
   - Message management (purge)
   - Channel management (lock, slowmode)

5. **Everyone**
   - Utility commands (help, ping, avatar, userinfo, etc.)
   - Fun commands (8ball, poll)
   - Self-service (create tickets, view own warnings)

## 🎨 Visual Design

All commands use consistent, modern embed styling:

- ✅ **Success**: Green embeds for successful operations
- ❌ **Error**: Red embeds for errors with helpful messages
- ⚠️ **Warning**: Orange embeds for warnings
- ℹ️ **Info**: Blue embeds for information
- 🛡️ **Mod Actions**: Dark red embeds with case tracking
- 👤 **User Info**: Rich user profiles with stats
- 🏰 **Server Info**: Comprehensive server statistics

## 📖 Usage Examples

### Basic Moderation
```bash
# Ban with message deletion
/ban user:@spammer reason:Advertising delete-days:7

# Timeout with duration
/timeout user:@rulebreaker duration:1h reason:Spam

# Warn user
/warn user:@minor_issue reason:Please read the rules

# Bulk delete messages
/purge amount:50
```

### Advanced Features
```bash
# Setup ticket system
/ticket-setup category:Support support-role:@Support

# Create reaction role message
/reactionrole create mode:button type:unique

# Configure automod
/automod enable
/automod antispam threshold:5 action:timeout

# Setup logging
/logging setup message-log:#logs member-log:#logs
```

### Admin Commands
```bash
# Send announcement
/announce channel:#general message:Important update! title:Announcement

# Toggle command
/command disable poll

# Configure bot appearance
/setbotname name:Support Bot
```

## 🔧 Technical Details

### Built With
- **Discord.js v14**: Modern Discord API library
- **Node.js**: JavaScript runtime
- **JSON Storage**: Lightweight persistent storage

### Architecture
```
├── commands/
│   ├── slash/          # 35 slash commands
│   └── prefix/         # 28 prefix commands (k!)
├── events/             # Event handlers
│   ├── messageCreate.js
│   ├── ready.js
│   └── guildCreate.js
├── utils/              # Utility modules
│   ├── embedTemplate.js    # Centralized embed styling
│   ├── permissions.js      # Permission checking
│   ├── ticketManager.js    # Ticket system logic
│   ├── reactionRoleManager.js
│   ├── logger.js           # Advanced logging
│   ├── automod.js          # Automod engine
│   ├── modLog.js           # Mod action logging
│   └── caseManager.js      # Case tracking
├── data/               # Data storage
│   ├── config.json         # Per-guild configuration
│   ├── warnings.json       # Warning records
│   ├── cases.json          # Case database
│   └── transcripts/        # Ticket transcripts
└── index.js            # Main bot file
```

### Required Bot Permissions
```
- Read Messages/View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Add Reactions
- Manage Messages
- Manage Channels
- Manage Roles
- Ban Members
- Kick Members
- Moderate Members (Timeout)
```

### Required Intents
```javascript
Guilds, GuildMessages, MessageContent, GuildMembers,
GuildMessageReactions, GuildModeration, GuildVoiceStates
```

## 🌟 Standout Features

### Multi-Guild Support
- All configurations stored per-guild
- No interference between servers
- Custom bot name/avatar per guild

### Case Tracking
- Every mod action gets a unique case ID
- View full case history with `/cases`
- Remove false cases with `/removecase`

### Smart Automod
- Intelligent spam detection with time-based tracking
- Whitelist system for trusted roles
- Configurable thresholds and punishments
- Automatic cleanup of tracking data

### Beautiful Embeds
- Consistent color scheme across all commands
- Mobile-optimized layouts
- Rich information display
- User avatars and thumbnails

## 📊 Command Details

### Duration Format
Used in timeout, poll, automod:
- `10s` - 10 seconds
- `5m` - 5 minutes  
- `2h` - 2 hours
- `7d` - 7 days
- Maximum timeout: 28 days

### Purge Limitations
- Maximum 100 messages per command
- Messages older than 14 days cannot be bulk deleted (Discord limitation)
- Optional user filter to target specific users

### Ticket Features
- Automatic numbering (ticket-1, ticket-2, etc.)
- Permission-based access control
- Complete chat history transcripts
- Support team role management

### Reaction Roles
- **Normal Mode**: Users can select multiple roles
- **Unique Mode**: Selecting one role removes others
- **Button Mode**: Clean button interface
- **Reaction Mode**: Classic emoji reactions

## 🛠️ Development

### Adding New Commands
1. Create file in `commands/slash/yourcommand.js`
2. Use `SlashCommandBuilder` for command definition
3. Implement `execute(interaction)` function
4. Use `EmbedTemplate` for consistent styling
5. Check permissions with `hasModeratorPermission()` or `hasAdminPermission()`

### Testing
```bash
# Validate syntax
node -c index.js

# Start with auto-restart
npm run dev
```

## 📝 Configuration Files

### data/config.json Structure
```json
{
  "guildId": {
    "roleConfig": {
      "moderatorRoleId": "123...",
      "adminRoleId": "456..."
    },
    "ticketConfig": {
      "enabled": true,
      "categoryId": "789...",
      "supportRoleIds": ["111..."],
      "counter": 5,
      "openTickets": ["ticket-1", "ticket-2"]
    },
    "logConfig": {
      "messageLog": "channel_id",
      "memberLog": "channel_id",
      "voiceLog": "channel_id",
      "modLog": "channel_id",
      "serverLog": "channel_id"
    },
    "automodConfig": {
      "enabled": true,
      "antiSpam": { "enabled": true, "threshold": 5, "punishment": "warn" },
      "antiInvite": { "enabled": true, "punishment": "timeout" },
      "antiCaps": { "enabled": true, "threshold": 70 },
      "antiMassMention": { "enabled": true, "threshold": 5 },
      "antiEmojiSpam": { "enabled": true, "threshold": 10 },
      "customWords": { "enabled": false, "words": [] },
      "whitelistedRoles": ["role_id"]
    },
    "reactionRoleConfig": {
      "messageId": {
        "roles": { "emoji": "roleId" },
        "mode": "normal",
        "type": "button"
      }
    }
  }
}
```

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source under the MIT License.

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/Tejaswa-Agarwal/KryonMC-Bot/issues)
- **Questions**: Create a discussion
- **Documentation**: Check `/help` command in Discord

## 🎯 Roadmap

- [ ] Web dashboard for configuration
- [ ] Database support (PostgreSQL/MongoDB)
- [ ] Advanced analytics
- [ ] Custom command creation
- [ ] Music commands
- [ ] Economy system

## 📈 Version History

### v3.0.0 (Current)
- ✅ Complete command modernization
- ✅ Unified embed template system
- ✅ Enhanced permission system
- ✅ Ticket system
- ✅ Reaction roles
- ✅ Advanced logging (5 categories)
- ✅ Enhanced automod (6 filters)
- ✅ Multi-guild support
- ✅ Case tracking system
- ✅ Removed 11 duplicate/unnecessary commands
- ✅ Updated all commands with consistent embeds

### v2.0.0
- Complete refactor from Minecraft bot
- Discord.js v14 migration
- Added moderation commands
- Added utility commands

---

**Made with ❤️ for Discord communities**

*Bot Owner: 1124168034332975204*
