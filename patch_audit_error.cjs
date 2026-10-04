const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

content = content.replace(
    /alert\('❌ Có lỗi xảy ra khi lưu phiếu kiểm kê'\);/g,
    `alert('❌ Lỗi: ' + (error?.message || error?.details || JSON.stringify(error)));`
);

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Patched error message');
