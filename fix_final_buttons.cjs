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

  // Fix buttons that have bg-blue-600, bg-teal-600, bg-red-600
  // Standardize them to small, inline-flex buttons for mobile header
  content = content.replace(/(<button[^>]*className=")([^"]*(?:bg-blue-600|bg-teal-600|bg-red-600)[^"]*)(")/g, (match, p1, p2, p3) => {
    // skip if it's already properly sized or hidden
    let newClass = p2.replace(/flex-1 /g, '')
                     .replace(/md:flex-none /g, '')
                     .replace(/w-full /g, '')
                     .replace(/md:w-auto /g, '')
                     .replace(/px-4 py-2/g, 'px-3 py-2 text-sm')
                     .replace(/gap-2/g, 'gap-1.5');
                     
    if (!newClass.includes('inline-flex') && !newClass.includes('hidden')) {
      newClass = newClass.replace(/flex /g, 'inline-flex ');
    }
    
    // Add whitespace-nowrap if missing to prevent text wrapping inside button
    if (!newClass.includes('whitespace-nowrap')) {
      newClass += ' whitespace-nowrap';
    }
    
    return p1 + newClass + p3;
  });

  // Make title whitespace-nowrap
  content = content.replace(/<h1 className="(text-2xl md:text-3xl|text-3xl|text-2xl) font-bold text-gray-(800|900)">/g, '<h1 className="$1 font-bold text-gray-$2 whitespace-nowrap">');

  fs.writeFileSync(filename, content, 'utf8');
});
console.log('Fixed buttons and titles');
