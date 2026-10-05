const fs = require('fs');
const content = fs.readFileSync('src/components/Layout.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('itemsToRender = '));
if(start !== -1) {
    console.log(lines.slice(start - 20, start + 25).join('\n'));
} else {
    const backupStart = lines.findIndex(l => l.includes('const getBottomNavItems'));
    console.log(lines.slice(backupStart - 5, backupStart + 35).join('\n'));
}
