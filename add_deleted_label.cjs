const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailRequisitionModal.tsx', 'utf8');

content = content.replace(
    /return items\.find\(i => i\.id === itemId\)\?.name \|\| itemId;/g,
    `return items.find(i => i.id === itemId)?.name || \`[Đã xóa] \${itemId}\`;`
);
fs.writeFileSync('src/components/inventory/DetailRequisitionModal.tsx', content, 'utf8');

let content2 = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');
content2 = content2.replace(
    /return items\.find\(i => i\.id === itemId\)\?.name \|\| itemId;/g,
    `return items.find(i => i.id === itemId)?.name || \`[Đã xóa] \${itemId}\`;`
);
fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content2, 'utf8');

console.log('Added [Đã xóa] label');
