const fs = require('fs');
const filename = 'src/components/devices/MeasurementSessionModal.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(/className="bg-white p-6 rounded-lg/g, 'className="bg-white p-3 sm:p-6 rounded-lg');
content = content.replace(/className="space-y-6 max-w-2xl mx-auto bg-white p-6 rounded-lg/g, 'className="space-y-6 max-w-2xl mx-auto bg-white p-4 sm:p-6 rounded-lg');
content = content.replace(/<div className="p-6 border-t border-gray-200/g, '<div className="p-4 sm:p-6 border-t border-gray-200');

fs.writeFileSync(filename, content, 'utf8');
