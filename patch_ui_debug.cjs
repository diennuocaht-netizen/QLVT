const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

content = content.replace(
    '<h3 className="text-lg font-semibold text-gray-900 mb-4">Danh SAch V-t T</h3>',
    '<h3 className="text-lg font-semibold text-gray-900 mb-4">Danh SAch V-t T (Debug: {items.length} items loaded. Items in slip: {JSON.stringify(slip.items)})</h3>'
);

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('Patched with UI debug');
