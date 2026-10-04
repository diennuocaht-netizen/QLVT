const fs = require('fs');

let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

// For Issue (Xuất)
content = content.replace(
    /<span className="font-medium">\{getItemCode\(item\.itemId\)\}<\/span>\s*<br \/>\s*<span className="text-sm text-gray-600">\{getItemName\(item\.itemId\)\}<\/span>/g,
    `<span className="font-medium">{getItemName(item.itemId)}</span>
                                <br />
                                <span className="text-sm text-gray-600">{getItemCode(item.itemId)}</span>`
);

// I should also check if the Receipt (Nhập) view has separate columns or the same structure
fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('Swapped name and code in DetailSlipModal');
