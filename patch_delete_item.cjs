const fs = require('fs');
let content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');

content = content.replace(
    /mod\.logActivity\(\{ action: 'delete_item', entityType: 'inventory_item', entityId: id \}\)/g,
    `mod.logActivity({ action: 'delete_item', entityType: 'inventory_item', entityId: id, details: { code: itemToDelete.code, name: itemToDelete.name } })`
);

fs.writeFileSync('src/pages/InventoryItems.tsx', content, 'utf8');
console.log('Fixed delete_item in InventoryItems.tsx');
