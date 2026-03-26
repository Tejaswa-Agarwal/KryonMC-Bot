const fs = require('fs');
const path = require('path');

const casesFile = path.join(__dirname, '..', 'data', 'cases.json');

function loadCases() {
    if (fs.existsSync(casesFile)) {
        return JSON.parse(fs.readFileSync(casesFile, 'utf8'));
    }
    return {};
}

function saveCases(cases) {
    fs.writeFileSync(casesFile, JSON.stringify(cases, null, 2));
}

function createCase(guildId, userId, type, moderatorId, moderatorTag, reason, additional = {}) {
    const cases = loadCases();
    
    if (!cases[guildId]) cases[guildId] = {};
    if (!cases[guildId][userId]) cases[guildId][userId] = [];
    
    const caseNumber = getCaseCount(guildId) + 1;
    
    const caseData = {
        caseId: caseNumber,
        type: type, // ban, kick, timeout, warn, etc.
        userId: userId,
        moderatorId: moderatorId,
        moderator: moderatorTag,
        reason: reason,
        timestamp: Date.now(),
        active: true,
        ...additional
    };
    
    cases[guildId][userId].push(caseData);
    saveCases(cases);
    
    return caseNumber;
}

function getCaseCount(guildId) {
    const cases = loadCases();
    if (!cases[guildId]) return 0;
    
    let count = 0;
    Object.values(cases[guildId]).forEach(userCases => {
        count += userCases.length;
    });
    
    return count;
}

function getUserCases(guildId, userId, activeOnly = false) {
    const cases = loadCases();
    if (!cases[guildId] || !cases[guildId][userId]) return [];
    
    if (activeOnly) {
        return cases[guildId][userId].filter(c => c.active);
    }
    
    return cases[guildId][userId];
}

function removeCase(guildId, caseId) {
    const cases = loadCases();
    if (!cases[guildId]) return false;
    
    let found = false;
    for (const userId in cases[guildId]) {
        const caseIndex = cases[guildId][userId].findIndex(c => c.caseId === caseId);
        if (caseIndex !== -1) {
            cases[guildId][userId].splice(caseIndex, 1);
            found = true;
            break;
        }
    }
    
    if (found) {
        saveCases(cases);
    }
    
    return found;
}

function deactivateCase(guildId, caseId) {
    const cases = loadCases();
    if (!cases[guildId]) return false;
    
    let found = false;
    for (const userId in cases[guildId]) {
        const caseData = cases[guildId][userId].find(c => c.caseId === caseId);
        if (caseData) {
            caseData.active = false;
            found = true;
            break;
        }
    }
    
    if (found) {
        saveCases(cases);
    }
    
    return found;
}

module.exports = {
    createCase,
    getUserCases,
    removeCase,
    deactivateCase,
    getCaseCount,
    loadCases,
    saveCases
};
