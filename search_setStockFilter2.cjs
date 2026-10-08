const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');
const lines = content.split('\n');
const starts = [];
lines.forEach((l, i) => { if (l.includes('setStockFilter') && i > 50) starts.push(i); });
starts.forEach(start => {
    console.log("--- MATCH ---");
    console.log(lines.slice(Math.max(0, start - 2), start + 5).join('\n'));
});
