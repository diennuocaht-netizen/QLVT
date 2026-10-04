const fs = require('fs');

let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

// For Issue (Xuất)
content = content.replace(
    /<span className="font-medium">\{getItemName\(item\.itemId\)\}<\/span>\s*<br \/>\s*<span className="text-sm text-gray-600">\{getItemCode\(item\.itemId\)\}<\/span>/g,
    `<span className="font-semibold text-base text-indigo-700 block mb-1">{getItemName(item.itemId)}</span>
                                <span className="text-sm text-gray-500">{getItemCode(item.itemId)}</span>`
);

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('Made item name larger in DetailSlipModal');
