const fs = require('fs');
const lines = fs.readFileSync('src/components/inventory/DetailAuditModal.tsx', 'utf8').split('\n');
for (let i = Math.max(0, 205); i < Math.min(lines.length, 225); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
