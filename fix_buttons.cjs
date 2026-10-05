const fs = require('fs');
const files = ['src/pages/InventoryRequisitions.tsx', 'src/pages/InventoryAudits.tsx', 'src/pages/InventoryIssues.tsx', 'src/pages/InventoryReceipts.tsx', 'src/pages/InventoryItems.tsx'];

files.forEach(filename => {
  let content = fs.readFileSync(filename, 'utf8');
  
  // Hide all Export/Import buttons on mobile
  content = content.replace(/className="([^"]*(?:Export|Excel|Download|Upload)[^"]*)"/g, (match, p1) => {
    if (!p1.includes('md:flex') && !p1.includes('md:hidden') && !p1.includes('hidden ')) {
      return `className="hidden md:flex ${p1.replace('flex ', '')}"`;
    }
    return match;
  });

  // Make sure the primary buttons (bg-blue-600, bg-teal-600, bg-red-600) are small on mobile but still visible
  content = content.replace(/className="([^"]*(?:bg-blue-600|bg-teal-600|bg-red-600)[^"]*)"/g, (match, p1) => {
    let newClass = p1.replace(/px-4 py-2/g, 'px-3 py-1.5 text-sm');
    newClass = newClass.replace(/flex-1 md:flex-none /g, '');
    newClass = newClass.replace(/inline-flex items-center justify-center gap-1\.5 px-3 py-1\.5 text-sm font-medium /g, 'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ');
    return `className="${newClass}"`;
  });

  fs.writeFileSync(filename, content, 'utf8');
});
console.log('Fixed export/import buttons');
