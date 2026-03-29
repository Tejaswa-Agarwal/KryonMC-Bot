const fs = require('fs');
const path = require('path');

function ensureParentDir(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function readJsonFile(filePath, fallback = {}) {
    if (!fs.existsSync(filePath)) return fallback;
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (_error) {
        return fallback;
    }
}

function writeJsonFile(filePath, value) {
    ensureParentDir(filePath);
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function updateJsonFile(filePath, updater, fallback = {}) {
    const current = readJsonFile(filePath, fallback);
    const next = updater(current);
    writeJsonFile(filePath, next);
    return next;
}

module.exports = {
    readJsonFile,
    writeJsonFile,
    updateJsonFile,
};
