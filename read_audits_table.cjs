const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryAudits.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('Mã Phiếu') || l.includes('MÃ Phi'));
if (start >= 0) {
    console.log(lines.slice(start - 5, start + 40).join('\n'));
} else {
    console.log('Not found');
}
