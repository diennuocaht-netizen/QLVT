const fs = require('fs');
const glob = require('glob'); // Note: glob might not be installed, use simple recursion
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
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes("supabase.from('inventory_items')")) {
        console.log(`--- ${f} ---`);
        const lines = content.split('\n');
        lines.forEach((l, i) => {
            if (l.includes("supabase.from('inventory_items')")) {
                console.log(`L${i+1}: ${l.trim()}`);
            }
        });
    }
});
