const fs = require('fs');
let content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');

content = content.replace(
    /import\('\.\.\/utils\/activityLogger'\)\.then\(mod => mod\.logActivity\(\{ action: 'delete_item', entityType: 'inventory_item', entityId: id, details: \{ code: itemToDelete\.code, name: itemToDelete\.name \} \}\)\);/g,
    `const itemToDelete = items.find(i => i.id === id);
          if (itemToDelete) {
            import('../utils/activityLogger').then(mod => mod.logActivity({ action: 'delete_item', entityType: 'inventory_item', entityId: id, details: { code: itemToDelete.code, name: itemToDelete.name } }));
          } else {
            import('../utils/activityLogger').then(mod => mod.logActivity({ action: 'delete_item', entityType: 'inventory_item', entityId: id }));
          }`
);

fs.writeFileSync('src/pages/InventoryItems.tsx', content, 'utf8');
console.log('Fixed reference error in InventoryItems.tsx');
