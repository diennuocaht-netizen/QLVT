const fs = require('fs');
const files = ['src/pages/InventoryItems.tsx', 'src/pages/InventoryReceipts.tsx', 'src/pages/InventoryIssues.tsx', 'src/pages/InventoryRequisitions.tsx', 'src/pages/InventoryAudits.tsx'];

function shrinkButtons(filename) {
  let content = fs.readFileSync(filename, 'utf8');

  // Shrink the primary action buttons that were made flex-1
  content = content.replace(/className="flex-1 md:flex-none flex (?:items-center justify-center|justify-center items-center) gap-2 px-4 py-2 (bg-(?:blue|teal|red)-600 text-white rounded-lg hover:bg-(?:blue|teal|red)-700 whitespace-nowrap shadow-sm)"/g, 
    'className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium $1"');
    
  // Also fix any other flex-1 buttons in the header if they exist (like Xuất Excel if it wasn't hidden)
  // Actually, wait, let's just make the header flex layout better.
  content = content.replace(/<div className="flex flex-wrap gap-2 w-full md:w-auto">/g, 
    '<div className="flex flex-wrap gap-2 mt-2 md:mt-0">');

  // Fix title wrapping
  content = content.replace(/<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">/g, 
    '<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">');

  fs.writeFileSync(filename, content, 'utf8');
}

files.forEach(shrinkButtons);
console.log('Shrunk buttons');
