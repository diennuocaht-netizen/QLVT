const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

content = content.replace(
  /<h2 className="text-xl font-bold text-gray-900">.*<\/h2>/,
  '<h2 className="text-xl font-bold text-gray-900">{audit ? `Chỉnh sửa Phiếu Kiểm Kê: ${audit.code}` : "Tạo Phiếu Kiểm Kê Mới"}</h2>'
);

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Fixed AuditModal title');
