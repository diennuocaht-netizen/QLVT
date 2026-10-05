const fs = require('fs');
let content = fs.readFileSync('src/pages/InventoryIssues.tsx', 'utf8');

content = content.replace(
  /className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"/g,
  'className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 whitespace-nowrap shadow-sm"'
);

// Thêm Phiếu Xuất (it might be red)
content = content.replace(
  /className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"/g,
  'className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 whitespace-nowrap shadow-sm"'
);

// We need flex-wrap for the container if not already there
content = content.replace(
  /<div className="flex gap-2">/,
  '<div className="flex flex-wrap gap-2 w-full md:w-auto">'
);

fs.writeFileSync('src/pages/InventoryIssues.tsx', content, 'utf8');
console.log('Patched InventoryIssues.tsx');
