const fs = require('fs');
let content = fs.readFileSync('src/pages/Devices.tsx', 'utf8');

content = content.replace(
    /<button \s*onClick=\{handleAddNew\}\s*className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm \s*font-medium"\s*>/g,
    `<button onClick={() => setIsVerifyModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center text-sm font-medium shadow-sm mr-2">
              <CheckCircle className="w-4 h-4 mr-2" /> Xác nhận đã kiểm tra
            </button>
            <button 
              onClick={handleAddNew}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm font-medium"
            >`
);

fs.writeFileSync('src/pages/Devices.tsx', content, 'utf8');
console.log('Fixed verify button rendering in Devices.tsx');
