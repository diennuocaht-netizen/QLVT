const fs = require('fs');

function checkFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    const regex = /supabase[\s\n]*\.from\('inventory_items'\)[\s\n]*\.select\('\*'\)(?!\.limit)/g;
    if (regex.test(content)) {
        console.log('Unpatched:', file);
    }
}

const glob = require('glob');
glob.sync('src/**/*.tsx').forEach(checkFile);
