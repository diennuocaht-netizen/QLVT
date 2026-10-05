const fs = require('fs');

const files = [
  'src/pages/InventoryRequisitions.tsx', 
  'src/pages/InventoryAudits.tsx', 
  'src/pages/InventoryIssues.tsx', 
  'src/pages/InventoryReceipts.tsx', 
  'src/pages/InventoryItems.tsx'
];

files.forEach(filename => {
  let content = fs.readFileSync(filename, 'utf8');

  // Hide Xuất Excel buttons
  content = content.replace(
    /(<button[^>]*onClick=\{handleExportExcel\}[^>]*className=")([^"]*)(")/g,
    (match, p1, p2, p3) => {
      if (!p2.includes('hidden md:flex') && !p2.includes('hidden md:inline-flex')) {
        return `${p1}hidden md:flex ${p2.replace(/flex /g, '')}${p3}`;
      }
      return match;
    }
  );

  // Hide Nhập Excel buttons
  content = content.replace(
    /(<button[^>]*onClick=\{handleImportClick\}[^>]*className=")([^"]*)(")/g,
    (match, p1, p2, p3) => {
      if (!p2.includes('hidden md:flex') && !p2.includes('hidden md:inline-flex')) {
        return `${p1}hidden md:flex ${p2.replace(/flex /g, '')}${p3}`;
      }
      return match;
    }
  );

  fs.writeFileSync(filename, content, 'utf8');
});

console.log('Explicitly hid Export/Import buttons');
