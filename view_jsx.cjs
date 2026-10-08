const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('return ('));
if (start !== -1) {
    console.log(lines.slice(start + 40, start + 100).join('\n'));
}
