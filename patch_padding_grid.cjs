const fs = require('fs');

function addBottomPadding(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replace(
    /<div className="md:hidden grid grid-cols-1 gap-4">/g,
    '<div className="md:hidden grid grid-cols-1 gap-4 pb-24">'
  );
  fs.writeFileSync(filename, content, 'utf8');
}

['src/pages/InventoryReceipts.tsx', 'src/pages/InventoryIssues.tsx', 'src/pages/InventoryRequisitions.tsx', 'src/pages/InventoryAudits.tsx'].forEach(addBottomPadding);
console.log('Added pb-24 to grid');
