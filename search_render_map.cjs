const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex((l, i) => i > 600 && l.includes('.map(') && (l.includes('=>') || l.includes('(')));
if(match !== -1) {
    console.log(lines.slice(Math.max(0, match - 5), match + 30).join('\n'));
}
