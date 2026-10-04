const fs = require('fs');
let content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');

content = content.replace(
  /style=\{\{ paddingBottom: 'calc\(1rem \+ env\(safe-area-inset-bottom\)\)' \}\}/,
  `style={{ marginBottom: 'env(safe-area-inset-bottom)' }}`
);

fs.writeFileSync('src/pages/InventoryItems.tsx', content, 'utf8');
console.log('Fixed FAB styling');
