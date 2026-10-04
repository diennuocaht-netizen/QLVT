const fs = require('fs');

let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

// For Cell (Nhập)
content = content.replace(
    /(\<td className="px-4 py-3 text-gray-600 text-sm">\{item\.requisitionId \? `T.?.? tr.?.?nh: \$\{getRequisitionCode\(item\.requisitionId\)\}` : 'Nh.?.?n ngoA.?.?i'\}<\/td>)/g,
    `$1
                              <td className="px-4 py-3 text-gray-600">{item.notes || '-'}</td>`
);

// For Cell (Xuất)
content = content.replace(
    /(\<td className="px-4 py-3 text-gray-600">\{item\.costCode \|\| '-.'\}<\/td>)/g,
    `$1
                              <td className="px-4 py-3 text-gray-600">{item.notes || '-'}</td>`
);

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('Added Ghi chú cells to DetailSlipModal');
