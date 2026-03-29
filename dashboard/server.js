require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');

const app = express();
const PORT = process.env.DASHBOARD_PORT || 25575;
const HOST = process.env.DASHBOARD_HOST || '0.0.0.0';
const NO_AUTH_MODE = process.env.DASHBOARD_NO_AUTH === 'true';

function getBotViewData(client) {
    const botId = client?.user?.id || process.env.DISCORD_CLIENT_ID || '';
    const inviteUrl = botId
        ? `https://discord.com/api/oauth2/authorize?client_id=${botId}&permissions=8&scope=bot%20applications.commands`
        : '#';

    return {
        botClientId: botId,
        inviteUrl,
        bot: {
            name: client?.user?.username || 'Axion',
            tag: client?.user?.tag || 'Axion',
            guildCount: client?.guilds?.cache?.size || 0,
            commandCount: client?.slashCommands?.size || 0,
            avatar: client?.user?.displayAvatarURL?.({ size: 128 }) || '/img/axion-logo.png',
        },
    };
}

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'), { etag: false, maxAge: 0, setHeaders: (res) => { res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); res.setHeader('Pragma', 'no-cache'); res.setHeader('Expires', '0'); } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// Passport setup
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Discord OAuth2 Strategy
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    passport.use(new Strategy({
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: process.env.DASHBOARD_CALLBACK || `http://localhost:${PORT}/callback`,
        scope: ['identify', 'guilds']
    }, (accessToken, refreshToken, profile, done) => {
        process.nextTick(() => done(null, profile));
    }));

    app.use(passport.initialize());
    app.use(passport.session());
}

// Auth middleware
function checkAuth(req, res, next) {
    if (NO_AUTH_MODE) {
        req.user = req.user || { username: 'Dashboard Admin', id: 'local-admin', guilds: [] };
        return next();
    }
    if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
        res.status(503).render('error', { user: req.user, message: 'Dashboard OAuth is not configured yet.' });
        return;
    }
    if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) return next();
    res.redirect('/login');
}

// Routes
app.get('/', (req, res) => {
    const viewData = getBotViewData(app.locals.client);
    res.render('index', { user: req.user, ...viewData });
});

app.get('/login', (req, res, next) => {
    if (NO_AUTH_MODE) {
        res.redirect('/dashboard');
        return;
    }
    if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
        res.status(503).render('error', { user: req.user, message: 'Dashboard OAuth is not configured yet. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.' });
        return;
    }
    return passport.authenticate('discord')(req, res, next);
});

app.get('/callback',
    (req, res, next) => {
        if (NO_AUTH_MODE) {
            res.redirect('/dashboard');
            return;
        }
        if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
            res.redirect('/');
            return;
        }
        return passport.authenticate('discord', { failureRedirect: '/' })(req, res, next);
    },
    (req, res) => res.redirect('/dashboard')
);

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

app.get('/dashboard', checkAuth, (req, res) => {
    const viewData = getBotViewData(app.locals.client);
    res.render('dashboard', { user: req.user, noAuthMode: NO_AUTH_MODE, ...viewData });
});

app.get('/health', (_req, res) => {
    res.json({ ok: true, dashboard: true });
});

// API Routes
const apiRouter = require('./routes/api');
app.use('/api', checkAuth, apiRouter);

// Server routes
const serverRouter = require('./routes/server');
app.use('/server', checkAuth, serverRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { user: req.user });
});

// Start server
function startDashboard(client) {
    app.locals.client = client; // Make Discord client available to routes
    
    app.listen(PORT, HOST, () => {
        console.log(`📊 Dashboard running on http://${HOST}:${PORT}`);
        if (NO_AUTH_MODE) {
            console.log('⚠️ Dashboard NO_AUTH mode is enabled. Do not use in production.');
        }
    });
}

module.exports = { startDashboard, app };
