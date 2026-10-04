const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryAudits.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('setAudits(data'));
if (idx >= 0) {
    console.log(lines.slice(idx, idx + 10).join('\n'));
} else {
    console.log('Not found');
}
