const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryAudits.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('Thao tác') || l.includes('Thao t'));
if (start >= 0) {
    console.log(lines.slice(start - 5, start + 30).join('\n'));
} else {
    console.log('Not found');
}
