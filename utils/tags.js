const path = require('path');
const { readJsonFile, writeJsonFile } = require('./jsonFile');

const tagsPath = path.join(__dirname, '..', 'data', 'tags.json');

function getTags() {
    return readJsonFile(tagsPath, {});
}

function saveTags(tags) {
    writeJsonFile(tagsPath, tags);
}

function getGuildTags(guildId) {
    const tags = getTags();
    return tags[guildId] || {};
}

function setGuildTags(guildId, guildTags) {
    const tags = getTags();
    tags[guildId] = guildTags || {};
    saveTags(tags);
}

function createTag(guildId, name, content, authorId) {
    const tags = getTags();
    if (!tags[guildId]) tags[guildId] = {};
    const key = name.toLowerCase();
    if (tags[guildId][key]) return { success: false, error: 'Tag already exists' };
    tags[guildId][key] = {
        content,
        authorId,
        createdAt: Date.now(),
        uses: 0,
    };
    saveTags(tags);
    return { success: true };
}

function editTag(guildId, name, content) {
    const tags = getTags();
    const key = name.toLowerCase();
    if (!tags[guildId]?.[key]) return { success: false, error: 'Tag not found' };
    tags[guildId][key].content = content;
    tags[guildId][key].editedAt = Date.now();
    saveTags(tags);
    return { success: true };
}

function deleteTag(guildId, name) {
    const tags = getTags();
    const key = name.toLowerCase();
    if (!tags[guildId]?.[key]) return { success: false, error: 'Tag not found' };
    delete tags[guildId][key];
    saveTags(tags);
    return { success: true };
}

function useTag(guildId, name) {
    const tags = getTags();
    const key = name.toLowerCase();
    const tag = tags[guildId]?.[key];
    if (!tag) return null;
    tag.uses = (tag.uses || 0) + 1;
    saveTags(tags);
    return tag;
}

module.exports = {
    getGuildTags,
    setGuildTags,
    createTag,
    editTag,
    deleteTag,
    useTag,
};
