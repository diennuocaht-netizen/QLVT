const fs = require('fs');
const lines = fs.readFileSync('src/components/inventory/SlipModal.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('Chọn tờ trình') || l.includes('Ch.n t. trình'));
if(start !== -1) {
  console.log(lines.slice(Math.max(0, start - 10), start + 30).join('\n'));
} else {
  console.log("Not found.");
}
