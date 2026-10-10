const fs = require('fs');
let content = fs.readFileSync('src/pages/InventorySettings.tsx', 'utf8');

const injection = `
        if (auditTemplatesRes.data) {
          setAuditTemplates(auditTemplatesRes.data);
        }
        if (itemsRes.data) {
          setItems(itemsRes.data);
        }
`;

content = content.replace(
  "if (costCodesRes.error) throw costCodesRes.error;",
  "if (costCodesRes.error) throw costCodesRes.error;\n" + injection
);

fs.writeFileSync('src/pages/InventorySettings.tsx', content, 'utf8');
