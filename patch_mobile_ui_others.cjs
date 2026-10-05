const fs = require('fs');

function patchFile(filename) {
  let content = fs.readFileSync(filename, 'utf8');

  // Thêm Phiếu button
  content = content.replace(
    /className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"/g,
    'className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap shadow-sm"'
  );

  // Xuất Excel button
  content = content.replace(
    /className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"/g,
    'className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"'
  );

  // Card action buttons (Edit, Trash, etc) - enlarge
  content = content.replace(
    /className="p-1 text-gray-500/g,
    'className="p-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200'
  );
  content = content.replace(
    /className="p-1 text-blue-600/g,
    'className="p-2.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200'
  );
  content = content.replace(
    /className="p-1 text-red-600/g,
    'className="p-2.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200'
  );
  content = content.replace(
    /className="p-1 text-green-600/g,
    'className="p-2.5 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200'
  );

  // Enlarge icons to size={18} inside cards only? The regex above is safe enough.
  
  // Make title whitespace-nowrap on mobile
  content = content.replace(
    /<h1 className="text-2xl font-bold text-gray-900">/,
    '<h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">'
  );
  // Requisitions/Issues have text-3xl sometimes
  content = content.replace(
    /<h1 className="text-2xl md:text-3xl font-bold text-gray-800">/,
    '<h1 className="text-2xl md:text-3xl font-bold text-gray-800 whitespace-nowrap">'
  );

  // Fix button wrappers
  content = content.replace(
    /<div className="flex gap-2">/,
    '<div className="flex gap-2 w-full md:w-auto">'
  );

  fs.writeFileSync(filename, content, 'utf8');
  console.log(`Patched ${filename}`);
}

['src/pages/InventoryReceipts.tsx', 'src/pages/InventoryIssues.tsx', 'src/pages/InventoryRequisitions.tsx', 'src/pages/InventoryAudits.tsx'].forEach(patchFile);
