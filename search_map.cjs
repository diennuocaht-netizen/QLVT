const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('.map(') && l.includes('item'));
if (start !== -1) {
    console.log(lines.slice(Math.max(0, start - 15), start + 25).join('\n'));
} else {
    console.log("Not found.");
}
