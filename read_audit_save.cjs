const fs = require('fs');
const content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');
const lines = content.split('\n');
const saveIdx = lines.findIndex(l => l.includes('const handleSave ='));
if (saveIdx >= 0) {
    console.log(lines.slice(saveIdx, saveIdx + 60).join('\n'));
} else {
    console.log("Not found.");
}
