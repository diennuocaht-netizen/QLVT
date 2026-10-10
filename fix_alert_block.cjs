const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

const oldAlertBlock = `      const notFoundItems = auditLines.filter(line => line.isNotFound);
      if (notFoundItems.length > 0) {
        alert(\`o. Lu phiu kim kA thAnh cA'ng!\\ns,? ?A b? qua \${notFoundItems.length} vt t khA'ng t"n ti trAn app.\`);
      } else {
        alert('o. Lu phiu kim kA thAnh cA'ng!');
      }`;

// But wait, the mangled text might not match exactly. Let me use substring replacement via regex.
content = content.replace(
  /const notFoundItems = auditLines\.filter\(line => line\.isNotFound\);\s*if \(notFoundItems\.length > 0\) \{\s*alert\([^)]+\);\s*\} else \{\s*alert\([^)]+\);\s*\}/,
  'alert(`Lưu phiếu kiểm kê thành công với ${validLines.length} vật tư!`);'
);

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Fixed alert block');
