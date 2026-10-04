const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

content = content.replace(
    /<h3 className="text-lg font-semibold text-gray-900 mb-4">.*?<\/h3>/,
    `<h3 className="text-lg font-semibold text-gray-900 mb-4">
       Danh sách vật tư
       <div className="text-xs text-red-500 font-mono overflow-auto max-h-32">
         DEBUG: items.length = {items.length} | first item in slip: {JSON.stringify(slip.items[0])} | search id: {slip.items[0]?.itemId || slip.items[0]?.id || slip.items[0]?.item_id}
       </div>
     </h3>`
);

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('Patched with regex UI debug');
