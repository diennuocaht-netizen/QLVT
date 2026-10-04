const fs = require('fs');
const glob = require('glob');

glob.sync('src/**/*.tsx').forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let patched = false;
    
    const regex = /supabase[\s\n]*\.from\('inventory_items'\)[\s\n]*\.select\('\*'\)(?!\.limit)/g;
    if (regex.test(content)) {
        content = content.replace(regex, "supabase.from('inventory_items').select('*').limit(10000)");
        patched = true;
    }

    if (patched) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Patched limits in', file);
    }
});
