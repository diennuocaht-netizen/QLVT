const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

content = content.replace(
  /const notFoundItems = auditLines.filter\(line => line.isNotFound\);\s*if \(notFoundItems.length > 0\) \{\s*alert\(`✓ Lưu phiếu kiểm kê thành công!\\n⚠️ Đã bỏ qua \$\{notFoundItems.length\} vật tư không tồn tại trên app.`\);\s*\} else \{\s*alert\('✓ Lưu phiếu kiểm kê thành công!'\);\s*\}/,
  `alert(\`✓ Lưu phiếu kiểm kê thành công với \${validLines.length} vật tư!\`);`
);

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Fixed save alert');
