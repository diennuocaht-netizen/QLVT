const fs = require('fs');

let content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');

// Title wrapper
content = content.replace(
  /<h1 className="text-2xl font-bold text-gray-900">/g,
  '<h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">'
);

fs.writeFileSync('src/pages/InventoryItems.tsx', content, 'utf8');
console.log('Patched Title');
