const fs = require('fs');
const glob = require('glob');
const path = require('path');

function findFiles(dir, filter) {
    let results = [];
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            results = results.concat(findFiles(fullPath, filter));
        } else if (filter(fullPath)) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = findFiles('src', f => f.endsWith('.tsx') || f.endsWith('.ts'));
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes("supabase.from('inventory_items').select('*').limit(10000)")) {
        content = content.replace(
            /supabase\.from\('inventory_items'\)\.select\('\*'\)\.limit\(10000\)/g,
            "supabase.from('inventory_items').select('*').order('created_at', { ascending: false }).limit(10000)"
        );
        fs.writeFileSync(f, content, 'utf8');
        console.log(`Updated ${f}`);
    }
});
