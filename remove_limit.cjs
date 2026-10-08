const fs = require('fs');
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
let count = 0;
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes(".limit(10000)")) {
        content = content.replace(/\.limit\(10000\)/g, ".limit(999999)");
        fs.writeFileSync(f, content, 'utf8');
        count++;
        console.log(`Updated ${f}`);
    }
});
console.log(`Updated ${count} files.`);
