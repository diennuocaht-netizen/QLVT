const fs = require('fs');

const files = [
  'src/components/inventory/ItemModal.tsx',
  'src/components/inventory/SlipModal.tsx',
  'src/components/inventory/RequisitionModal.tsx',
  'src/components/DeviceProfileModal.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // 1. Make the wrapper fixed full screen on mobile, and let it handle flex
  content = content.replace(
    /className="bg-white rounded-xl shadow-xl w-full max-w-([^ ]+) max-h-\[90vh\] overflow-y-auto"/g,
    'className="bg-white w-full h-full md:h-auto md:rounded-xl shadow-xl md:max-w-$1 md:max-h-[90vh] flex flex-col overflow-hidden"'
  );

  // 2. The inner content needs to scroll if it's a <form> or <div> that holds the main content
  // In ItemModal: <form onSubmit={handleSubmit} className="p-6 space-y-6">
  // We need to carefully replace the first div/form after the header
  // Let's use a more targeted replacement
  
  if (file.includes('ItemModal')) {
    content = content.replace(
      /className="p-6 space-y-6"/,
      'className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col"'
    );
    // wrap inner fields to push footer down
    content = content.replace(
      /<div className="grid grid-cols-1 md:grid-cols-2 gap-6">/,
      '<div className="flex-1 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6">'
    );
    content = content.replace(
      /<div className="flex justify-end gap-3 pt-6 border-t border-gray-100">/,
      '</div><div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0 mt-auto bg-white sticky bottom-0">'
    );
  } else if (file.includes('RequisitionModal')) {
    // similar logic
    content = content.replace(
      /className="p-6 space-y-6"/,
      'className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col"'
    );
    content = content.replace(
      /<div className="grid grid-cols-1 md:grid-cols-3 gap-4">/,
      '<div className="flex-1 space-y-6"><div className="grid grid-cols-1 md:grid-cols-3 gap-4">'
    );
    content = content.replace(
      /<div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-8">/,
      '</div><div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0 mt-auto bg-white sticky bottom-0">'
    );
  }

  fs.writeFileSync(file, content, 'utf8');
}
console.log('Patched modal layouts');
