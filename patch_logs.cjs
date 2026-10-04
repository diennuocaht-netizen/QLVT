const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

content = content.replace(
    "const getItemName = (itemId: string) => {",
    "const getItemName = (itemId: string) => {\n    console.log('getting name for', itemId, 'from', items.length, 'items');"
);
content = content.replace(
    "const getItemCode = (itemId: string) => {",
    "const getItemCode = (itemId: string) => {\n    console.log('slip items:', slip?.items);"
);

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('Patched with logs');
