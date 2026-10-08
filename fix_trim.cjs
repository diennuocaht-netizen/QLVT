const fs = require('fs');
const filename = 'src/pages/InventoryItems.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(
  /const q = searchTerm\.toLowerCase\(\);/g,
  "const q = searchTerm.toLowerCase().trim();"
);

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed search term trim');
