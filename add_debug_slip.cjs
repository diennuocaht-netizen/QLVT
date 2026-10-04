const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

content = content.replace(
    /const getItemName = \(itemId: string\) => \{/,
    `const getItemName = (itemId: string) => {
      console.log('getting name for', itemId, 'from items:', items.map(i => i.id));
`
);

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('Added debug log');
