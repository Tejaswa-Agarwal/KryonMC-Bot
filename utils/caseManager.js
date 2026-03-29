const path = require('path');
const { readJsonFile, writeJsonFile } = require('./jsonFile');

const casesFile = path.join(__dirname, '..', 'data', 'cases.json');
const ladderFile = path.join(__dirname, '..', 'data', 'punishmentLadder.json');

function loadCases() {
    return readJsonFile(casesFile, {});
}

function saveCases(cases) {
    writeJsonFile(casesFile, cases);
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

function addCaseAppeal(guildId, caseId, userId, reason) {
    const cases = loadCases();
    if (!cases[guildId]) return false;

    for (const targetId in cases[guildId]) {
        const caseData = cases[guildId][targetId].find(c => c.caseId === caseId);
        if (caseData) {
            caseData.appeal = {
                userId,
                reason,
                status: 'pending',
                createdAt: Date.now()
            };
            saveCases(cases);
            return true;
        }
    }
    return false;
}

function reviewCaseAppeal(guildId, caseId, reviewerId, approve, note = '') {
    const cases = loadCases();
    if (!cases[guildId]) return false;

    for (const targetId in cases[guildId]) {
        const caseData = cases[guildId][targetId].find(c => c.caseId === caseId);
        if (caseData && caseData.appeal) {
            caseData.appeal.status = approve ? 'approved' : 'rejected';
            caseData.appeal.reviewedBy = reviewerId;
            caseData.appeal.reviewedAt = Date.now();
            caseData.appeal.note = note;
            if (approve) {
                caseData.active = false;
            }
            saveCases(cases);
            return true;
        }
    }
    return false;
}

function loadLadder() {
    return readJsonFile(ladderFile, {});
}

function saveLadder(ladder) {
    writeJsonFile(ladderFile, ladder);
}

function getPunishmentLadder(guildId) {
    const all = loadLadder();
    return all[guildId] || ['warn', 'timeout', 'kick', 'ban'];
}

function setPunishmentLadder(guildId, steps) {
    const normalized = (steps || [])
        .map(s => String(s).trim().toLowerCase())
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i);
    const all = loadLadder();
    all[guildId] = normalized.length ? normalized : ['warn', 'timeout', 'kick', 'ban'];
    saveLadder(all);
    return all[guildId];
}

module.exports = {
    createCase,
    getUserCases,
    removeCase,
    deactivateCase,
    getCaseCount,
    loadCases,
    saveCases,
    addCaseAppeal,
    reviewCaseAppeal,
    getPunishmentLadder,
    setPunishmentLadder
};
