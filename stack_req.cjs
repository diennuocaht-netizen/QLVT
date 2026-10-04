const fs = require('fs');

let content = fs.readFileSync('src/components/inventory/DetailRequisitionModal.tsx', 'utf8');

content = content.replace(
    /<td className="px-4 py-3 text-gray-900">\{getItemName\(item\.itemId\)\}<\/td>/g,
    `<td className="px-4 py-3 text-gray-900">
                                <span className="font-semibold text-base text-indigo-700 block mb-1">{getItemName(item.itemId)}</span>
                                <span className="text-sm text-gray-500">{getItemCode(item.itemId)}</span>
                              </td>`
);

fs.writeFileSync('src/components/inventory/DetailRequisitionModal.tsx', content, 'utf8');
console.log('Stacked name and code in Requisition');
