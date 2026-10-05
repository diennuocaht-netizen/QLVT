const fs = require('fs');

function flexWrap(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replace(
    /<div className="flex gap-2 w-full md:w-auto">/g,
    '<div className="flex flex-wrap gap-2 w-full md:w-auto">'
  );
  fs.writeFileSync(filename, content, 'utf8');
}

['src/pages/InventoryReceipts.tsx', 'src/pages/InventoryIssues.tsx', 'src/pages/InventoryRequisitions.tsx', 'src/pages/InventoryAudits.tsx'].forEach(flexWrap);
console.log('Added flex-wrap');
