const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

// Merge headers for isReceipt
content = content.replace(
    /<th className="px-4 py-3 text-left font-medium text-gray-600">Mã<\/th>\s*<th className="px-4 py-3 text-left font-medium text-gray-600">Tên Vật Tư<\/th>/g,
    '<th className="px-4 py-3 text-left font-medium text-gray-600">Vật Tư</th>'
);

// Merge cells for isReceipt
content = content.replace(
    /<td className="px-4 py-3 text-gray-900 font-medium">\{getItemCode\(item\.itemId\)\}<\/td>\s*<td className="px-4 py-3 text-gray-900">\{getItemName\(item\.itemId\)\}<\/td>/g,
    `<td className="px-4 py-3 text-gray-900">
                                <span className="font-semibold text-base text-indigo-700 block mb-1">{getItemName(item.itemId)}</span>
                                <span className="text-sm text-gray-500">{getItemCode(item.itemId)}</span>
                              </td>`
);

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('Fixed headers and cells in DetailSlipModal for isReceipt');
