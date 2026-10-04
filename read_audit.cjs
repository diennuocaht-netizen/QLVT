const fs = require('fs');
const content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');
const lines = content.split('\n');
const saveIdx = lines.findIndex(l => l.toLowerCase().includes('lưu') || l.includes('save') || l.includes('submit') || l.includes('handleSave'));
if (saveIdx >= 0) {
    console.log(lines.slice(Math.max(0, saveIdx - 10), saveIdx + 30).join('\n'));
} else {
    console.log("Not found.");
}
