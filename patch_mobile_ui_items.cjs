const fs = require('fs');

function patchFile(filename) {
  let content = fs.readFileSync(filename, 'utf8');

  // Replace QrCode top button
  content = content.replace(
    /className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"/g,
    'className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"'
  );
  
  // Replace Upload Excel top button
  content = content.replace(
    /className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm disabled:opacity-50"/g,
    'className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm disabled:opacity-50"'
  );
  
  // Replace Download Excel top button
  content = content.replace(
    /className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"/g,
    'className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"'
  );

  // Replace Thêm Vật Tư button
  content = content.replace(
    /className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"/g,
    'className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"'
  );

  // Make header flex-col on mobile
  content = content.replace(
    /<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">/,
    '<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">'
  );

  fs.writeFileSync(filename, content, 'utf8');
  console.log(`Patched ${filename}`);
}

patchFile('src/pages/InventoryItems.tsx');
