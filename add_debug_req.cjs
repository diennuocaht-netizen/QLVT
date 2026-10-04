const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailRequisitionModal.tsx', 'utf8');

content = content.replace(
    /const getItemName = \(itemId: string\) => \{/,
    `const getItemName = (itemId: string) => {
      console.log('DetailRequisitionModal getting name for', itemId, 'from items:', items.map(i => i.id));
`
);

fs.writeFileSync('src/components/inventory/DetailRequisitionModal.tsx', content, 'utf8');
console.log('Added debug log to req');
