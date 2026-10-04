const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryAudits.tsx', 'utf8');
const lines = content.split('\n');

// Find mobile view
const start = lines.findIndex(l => l.includes('md:hidden'));
if (start >= 0) {
    console.log(lines.slice(start - 5, start + 30).join('\n'));
} else {
    console.log('Mobile view not found');
}
