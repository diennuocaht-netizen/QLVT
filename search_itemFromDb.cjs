const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex(l => l.includes('function itemFromDatabase') || l.includes('const itemFromDatabase'));
if (match !== -1) {
    console.log(lines.slice(Math.max(0, match - 2), match + 20).join('\n'));
} else {
    // maybe imported?
    const matchImport = lines.findIndex(l => l.includes('itemFromDatabase'));
    if (matchImport !== -1) {
        console.log(lines.slice(Math.max(0, matchImport - 2), matchImport + 5).join('\n'));
    }
}
