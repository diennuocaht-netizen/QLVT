const fs = require('fs');

let lines = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8').split('\n');

// Find line 341 and insert after it
lines.splice(341, 0, '                            <td className="px-4 py-3 text-gray-600">{item.notes || \'-\'}</td>');

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', lines.join('\n'), 'utf8');
console.log('Added notes to isReceipt');
