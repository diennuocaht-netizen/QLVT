const fs = require('fs');
let content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');

// Replace the small mobile buttons with larger ones
content = content.replace(/gap-1 py-2 text-yellow-600/g, 'gap-1 py-3 text-yellow-600');
content = content.replace(/items-center py-2 text-indigo-600/g, 'items-center py-3 text-indigo-600');
content = content.replace(/items-center py-2 text-gray-700/g, 'items-center py-3 text-gray-700');
content = content.replace(/items-center py-2 text-blue-600/g, 'items-center py-3 text-blue-600');
content = content.replace(/size={16}/g, 'size={20}');

fs.writeFileSync('src/pages/InventoryItems.tsx', content, 'utf8');
console.log('Enlarged touch targets on mobile cards in InventoryItems');
