const fs = require('fs');
const file = 'src/components/inventory/BulkPrintQRModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix syntax errors introduced by escaping
content = content.replace(/\\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed syntax errors');
