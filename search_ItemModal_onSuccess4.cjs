const fs = require('fs');
const content = fs.readFileSync('src/components/inventory/ItemModal.tsx', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex((l, i) => i > 120 && l.includes('onSuccess'));
if (match !== -1) {
    console.log(lines.slice(Math.max(0, match - 10), match + 15).join('\n'));
}
