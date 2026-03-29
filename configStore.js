const path = require('path');
const { readJsonFile, writeJsonFile } = require('./utils/jsonFile');

const configFilePath = path.join(__dirname, 'data', 'config.json');

let config = {};

function loadConfig() {
    config = readJsonFile(configFilePath, {});
}

function saveConfig() {
    try {
        writeJsonFile(configFilePath, config);
    } catch (e) {
        console.error('Failed to write config.json:', e);
    }
}

function get(key) {
    return config[key];
}

function set(key, value) {
    config[key] = value;
    saveConfig();
}

loadConfig();

module.exports = {
    get,
    set,
};
