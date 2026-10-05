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

  // Remove flex-1 md:flex-none
  content = content.replace(/flex-1 md:flex-none /g, '');
  // Remove w-full md:w-auto from button wrapper
  content = content.replace(/className="flex gap-2 w-full md:w-auto"/g, 'className="flex gap-2"');
  // Make button wrapper flex-wrap
  content = content.replace(/className="flex gap-2"/g, 'className="flex flex-wrap gap-2"');
  // Remove w-full md:w-auto from buttons
  content = content.replace(/ w-full md:w-auto"/g, '"');

  // Change title wrapping
  content = content.replace(/<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">/g, '<div className="flex justify-between items-start md:items-center gap-3 mb-4 flex-wrap">');

  fs.writeFileSync(filename, content, 'utf8');
});

console.log('Made buttons inline and compact');
