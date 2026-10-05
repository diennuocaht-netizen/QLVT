const fs = require('fs');

const filename = 'src/components/inventory/GlobalCompletionModal.tsx';
let content = fs.readFileSync(filename, 'utf8');

// Replace overflow-hidden with overflow-x-auto for the table wrapper
content = content.replace(/<div className="border border-gray-200 rounded-lg overflow-hidden">/g, '<div className="border border-gray-200 rounded-lg overflow-x-auto">');

// Add whitespace-nowrap to the table to prevent word breaks
content = content.replace(/<table className="w-full text-sm">/g, '<table className="w-full text-sm whitespace-nowrap">');

// The main modal container max-w-3xl should have a w-full and a max-width on mobile like max-w-[95vw]
// Let's check how the modal is defined
content = content.replace(/<div className="bg-white rounded-xl shadow-xl w-full max-w-3xl/g, '<div className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] md:max-w-3xl');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed GlobalCompletionModal responsive layout');
