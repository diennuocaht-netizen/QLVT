const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex(l => l.includes('const [stockFilter'));
if(match !== -1) {
    console.log(lines.slice(Math.max(0, match - 2), match + 5).join('\n'));
}
