const fs = require('fs');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

async function migrate() {
    if (!fs.existsSync(DB_FILE)) {
        console.log('No database file found.');
        return;
    }

    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

    console.log('Migrating users...');

    for (let user of data.users) {
        // If password is not already hashed (bcrypt hashes start with $2a$ or $2b$)
        if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
            console.log(`Hashing password for ${user.username}...`);
            user.password = await bcrypt.hash(user.password, 10);
        }

        // Assign default role if missing
        if (!user.role) {
            user.role = 'teacher'; // Default to teacher as per previous app version
            console.log(`Assigned default role 'teacher' to ${user.username}`);
        }
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    console.log('Migration complete!');
}

migrate().catch(console.error);
