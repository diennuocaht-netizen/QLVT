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
    if (content.match(/supabase\.from\('(inventory_slips|inventory_requisitions)'\)\.select\('\*'\)/g)) {
        console.log(`Needs ordering: ${f}`);
    }
});
