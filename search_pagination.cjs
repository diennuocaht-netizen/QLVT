const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex(l => l.includes('pagination'));
if(match !== -1) {
    console.log(lines.slice(Math.max(0, match - 5), match + 20).join('\n'));
} else {
    const match2 = lines.findIndex(l => l.includes('.slice('));
    if (match2 !== -1) {
        console.log(lines.slice(Math.max(0, match2 - 5), match2 + 20).join('\n'));
    } else {
        console.log('No pagination found.');
    }
}
