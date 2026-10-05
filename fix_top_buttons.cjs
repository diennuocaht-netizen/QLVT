const fs = require('fs');

function patchFile(filename) {
  let content = fs.readFileSync(filename, 'utf8');

  // Replace Thêm Vật Tư button
  content = content.replace(
    /className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"/g,
    'className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"'
  );
  
  // Replace Upload Excel top button
  content = content.replace(
    /className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400"/g,
    'className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400"'
  );
  
  // Replace Download Excel top button
  content = content.replace(
    /className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"/g,
    'className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"'
  );

  fs.writeFileSync(filename, content, 'utf8');
  console.log(`Patched ${filename}`);
}

patchFile('src/pages/InventoryItems.tsx');
