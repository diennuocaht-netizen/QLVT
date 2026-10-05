const fs = require('fs');

const files = [
  'src/components/inventory/QuickIssueModal.tsx',
  'src/components/inventory/RequisitionModal.tsx'
];

files.forEach(filename => {
  if (fs.existsSync(filename)) {
    let content = fs.readFileSync(filename, 'utf8');

    // 1. Fix grid layout for the form
    content = content.replace(/<div className="grid grid-cols-2 gap-6">/g, '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">');
    // Also handle gap-4 cases
    content = content.replace(/<div className="grid grid-cols-2 gap-4">/g, '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">');

    // 2. Fix col-span-2
    content = content.replace(/className="col-span-2/g, 'className="col-span-1 sm:col-span-2');

    fs.writeFileSync(filename, content, 'utf8');
  }
});

console.log('Fixed other inventory modals');
