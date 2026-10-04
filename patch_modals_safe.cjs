const fs = require('fs');

const files = [
  'src/components/inventory/ItemModal.tsx',
  'src/components/inventory/RequisitionModal.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // 1. Make the wrapper fixed full screen on mobile, and let it handle flex
  content = content.replace(
    /className="bg-white rounded-xl shadow-xl w-full max-w-([^ ]+) max-h-\[90vh\] overflow-y-auto"/g,
    'className="bg-white w-full h-full md:h-auto md:rounded-xl shadow-xl md:max-w-$1 md:max-h-[90vh] flex flex-col overflow-hidden"'
  );

  // 2. Change the form/inner container to scroll
  content = content.replace(
    /className="p-6 space-y-6"/,
    'className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col"'
  );

  // 3. Make footer sticky
  content = content.replace(
    /<div className="flex justify-end gap-3 pt-6 border-t border-gray-100( mt-8)?">/,
    '<div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0 mt-auto bg-white sticky bottom-0">'
  );

  fs.writeFileSync(file, content, 'utf8');
}
console.log('Carefully patched modal layouts');
