const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

if (content.includes('item.notes')) {
    console.log('Already added');
} else {
    // For Nhập
    content = content.replace(
        /(<td[^>]*>\{item\.requisitionId \? `T.?.? tr.?.?nh: \$\{getRequisitionCode\(item\.requisitionId\)\}` : 'Nh.?.?n ngoA.?.?i'\}<\/td>)/g,
        '$1\n                              <td className="px-4 py-3 text-gray-600">{item.notes || \'-\'}</td>'
    );
    
    // For Xuất
    content = content.replace(
        /(<td[^>]*>\{item\.costCode \|\| '-'\}<\/td>)/g,
        '$1\n                              <td className="px-4 py-3 text-gray-600">{item.notes || \'-\'}</td>'
    );

    fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
    console.log('Added notes');
}
