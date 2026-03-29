const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const path = require('path');
const { readJsonFile, writeJsonFile } = require('./jsonFile');

const configPath = path.join(__dirname, '..', 'data', 'config.json');

function getConfig() {
    return readJsonFile(configPath, {});
}

function saveConfig(config) {
    writeJsonFile(configPath, config);
}

function getVerifyConfig(guildId) {
    const config = getConfig();
    return config[guildId]?.verifyConfig || {
        enabled: false,
        roleId: null,
        mode: 'button',
        humanCheck: {
            question: 'Type YES to verify.',
            answer: 'YES'
        }
    };
}

function setVerifyConfig(guildId, verifyConfig) {
    const config = getConfig();
    if (!config[guildId]) config[guildId] = {};
    config[guildId].verifyConfig = verifyConfig;
    saveConfig(config);
}

async function sendVerifyPanel(channel, title, description) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('verify_member')
            .setLabel('Verify')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success),
    );

    const message = await channel.send({
        embeds: [{
            title: title || 'Server Verification',
            description: description || 'Click **Verify** to get access to the server.',
            color: 0x57F287,
        }],
        components: [row],
    });

    return message;
}

function buildCaptchaChallenge(userId, guildId) {
    const seed = `${userId}${guildId}`;
    const a = (seed.charCodeAt(0) + seed.length) % 9 + 1;
    const b = (seed.charCodeAt(seed.length - 1) + seed.length * 3) % 9 + 1;
    return {
        prompt: `What is ${a} + ${b}?`,
        answer: String(a + b)
    };
}

async function grantVerifiedRole(interaction, verifyConfig) {
    const role = interaction.guild.roles.cache.get(verifyConfig.roleId);
    if (!role) {
        await interaction.reply({ content: '❌ Verification role no longer exists.', ephemeral: true });
        return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (member.roles.cache.has(role.id)) {
        await interaction.reply({ content: '✅ You are already verified.', ephemeral: true });
        return;
    }

    await member.roles.add(role);
    await interaction.reply({ content: `✅ Verified! You received ${role}.`, ephemeral: true });
}

async function handleVerifyButton(interaction) {
    if (!interaction.guild) {
        await interaction.reply({ content: '❌ This can only be used in a server.', ephemeral: true });
        return;
    }

    const verifyConfig = getVerifyConfig(interaction.guild.id);
    if (!verifyConfig?.enabled || !verifyConfig.roleId) {
        await interaction.reply({ content: '❌ Verification is not configured.', ephemeral: true });
        return;
    }

    const mode = verifyConfig.mode || 'button';

    if (mode === 'button') {
        await grantVerifiedRole(interaction, verifyConfig);
        return;
    }

    const modal = new ModalBuilder()
        .setCustomId(`verify_modal_${mode}`)
        .setTitle('Verification Check');

    let prompt = 'Type YES to verify.';
    if (mode === 'captcha') {
        const captcha = buildCaptchaChallenge(interaction.user.id, interaction.guild.id);
        prompt = captcha.prompt;
    } else if (mode === 'human') {
        prompt = verifyConfig.humanCheck?.question || 'Type YES to verify.';
    }

    const input = new TextInputBuilder()
        .setCustomId('verify_answer')
        .setLabel(prompt.slice(0, 45))
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function handleVerifyModal(interaction) {
    if (!interaction.guild) return;

    const verifyConfig = getVerifyConfig(interaction.guild.id);
    if (!verifyConfig?.enabled || !verifyConfig.roleId) {
        await interaction.reply({ content: '❌ Verification is not configured.', ephemeral: true });
        return;
    }

    const mode = verifyConfig.mode || 'button';
    const answer = interaction.fields.getTextInputValue('verify_answer')?.trim();

    let expected = 'YES';
    if (mode === 'captcha') {
        expected = buildCaptchaChallenge(interaction.user.id, interaction.guild.id).answer;
    } else if (mode === 'human') {
        expected = String(verifyConfig.humanCheck?.answer || 'YES');
    }

    if (String(answer).toLowerCase() !== String(expected).toLowerCase()) {
        await interaction.reply({ content: '❌ Verification failed. Please try again.', ephemeral: true });
        return;
    }

    await grantVerifiedRole(interaction, verifyConfig);
}

module.exports = {
    getVerifyConfig,
    setVerifyConfig,
    sendVerifyPanel,
    handleVerifyButton,
    handleVerifyModal,
};
