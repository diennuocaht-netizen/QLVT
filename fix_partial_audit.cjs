const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

// 1. Change the actualStock default
content = content.replace(
  /actualStock: existingItem \? \(existingItem\.actual_stock \?\? stock\) : stock,/g,
  "actualStock: existingItem ? (existingItem.actual_stock ?? '') : '',"
);
content = content.replace(
  /actualStock: existingItem \? existingItem\.actual_stock : stock,/g, // if it was written this way
  "actualStock: existingItem ? existingItem.actual_stock : '',"
);

// 2. Change the validLines logic
content = content.replace(
  /const validLines = auditLines\.filter\(line => !line\.isNotFound && line\.item\.id\);/g,
  "const validLines = auditLines.filter(line => !line.isNotFound && line.item.id && line.actualStock !== '');"
);

// 3. To make it clear in UI, maybe set the difference to 0 if actualStock is empty
content = content.replace(
  /difference: existingItem \? \(existingItem\.difference \?\? 0\) : 0,/g,
  "difference: existingItem ? (existingItem.difference ?? 0) : 0,"
);
// Actually difference calculation doesn't matter if it's not saved, but in UI it might show `-systemStock` if actualStock is empty.
// In handleActualStockChange:
content = content.replace(
  /newLines\[index\]\.difference = actual - newLines\[index\]\.systemStock;/g,
  "newLines[index].difference = actual - newLines[index].systemStock;"
);
// Wait, if it's empty, difference should be 0 or empty.
content = content.replace(
  /\} else \{\s*newLines\[index\]\.difference = 0;\s*\}/g,
  "} else { newLines[index].difference = 0; }"
);

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Fixed partial audit logic');
