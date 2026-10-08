const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('filteredItems ='));
if (start !== -1) {
    console.log(lines.slice(Math.max(0, start - 5), start + 35).join('\n'));
} else {
    // Try to find the filter logic
    const start2 = lines.findIndex(l => l.includes('items.filter('));
    if (start2 !== -1) {
        console.log(lines.slice(Math.max(0, start2 - 5), start2 + 35).join('\n'));
    }
}
