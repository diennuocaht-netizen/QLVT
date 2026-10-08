const fs = require('fs');
const content = fs.readFileSync('src/components/inventory/ItemModal.tsx', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex(l => l.includes('Creating new item'));
if (match !== -1) {
    console.log(lines.slice(Math.max(0, match - 2), match + 35).join('\n'));
}
