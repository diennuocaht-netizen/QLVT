const fs = require('fs');
const file = 'src/components/inventory/QRScannerModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "select('id, code, name, unit, category, specifications')",
  "select('id, code, name, unit, category, notes')" // or select('*')
);

// Also remove variant.specifications from the UI mapping
content = content.replace(
  /\{variant\.specifications && \(\s*<span className="text-sm text-gray-500">\{variant\.specifications\}<\/span>\s*\)\}/,
  `{variant.notes && (
                      <span className="text-sm text-gray-500 line-clamp-1">{variant.notes}</span>
                    )}`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed specifications column issue');
