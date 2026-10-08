const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');
const lines = content.split('\n');
const starts = [];
lines.forEach((l, i) => { if (l.includes('filteredItems')) starts.push(i); });
starts.forEach(start => {
    console.log("--- MATCH ---");
    console.log(lines.slice(Math.max(0, start - 5), start + 10).join('\n'));
});
if (starts.length === 0) {
    // If not filteredItems, check how they map items in JSX
    const starts2 = [];
    lines.forEach((l, i) => { if (l.includes('.map(') && l.includes('key=')) starts2.push(i); });
    starts2.forEach(start => {
        console.log("--- MATCH ---");
        console.log(lines.slice(Math.max(0, start - 2), start + 5).join('\n'));
    });
}
