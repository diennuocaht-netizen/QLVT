const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

content = content.replace(
  /if \(auditError\) throw auditError;/g,
  ''
);

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Removed dangling auditError');
