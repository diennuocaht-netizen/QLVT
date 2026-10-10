const fs = require('fs');
const lines = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('line.difference')) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
