const fs = require('fs');
const content = fs.readFileSync('src/components/inventory/SlipModal.tsx', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex(l => l.includes('searchTerm'));
if (match !== -1) {
    console.log(lines.slice(Math.max(0, match - 5), match + 30).join('\n'));
} else {
    console.log("No searchTerm found in SlipModal");
}
