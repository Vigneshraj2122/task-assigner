const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

// Memory Cache
let dbCache = null;

function init() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            users: [],
            tasks: [],
            classes: [],
            lessonPlans: [],
            assignments: [],
            habits: [],
            holidays: [],
            gamification: {}
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
    dbCache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

init();

function persist() {
    // Write asynchronously to not block the event loop
    fs.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), (err) => {
        if (err) console.error('DB Write Error:', err);
    });
}

module.exports = {
    get: (collection) => {
        return dbCache[collection] || [];
    },
    add: (collection, item) => {
        if (!dbCache[collection]) dbCache[collection] = [];
        const newItem = {
            ...item,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5) // Slightly better unique ID
        };
        dbCache[collection].push(newItem);
        persist();
        return newItem;
    },
    update: (collection, id, updates) => {
        if (!dbCache[collection]) return null;
        const index = dbCache[collection].findIndex(i => i.id === id);
        if (index === -1) return null;

        dbCache[collection][index] = { ...dbCache[collection][index], ...updates };
        persist();
        return dbCache[collection][index];
    },
    delete: (collection, id) => {
        if (!dbCache[collection]) return false;
        const initialLength = dbCache[collection].length;
        dbCache[collection] = dbCache[collection].filter(i => i.id !== id);
        persist();
        return dbCache[collection].length < initialLength;
    },
    find: (collection, predicate) => {
        return (dbCache[collection] || []).find(predicate);
    }
};
