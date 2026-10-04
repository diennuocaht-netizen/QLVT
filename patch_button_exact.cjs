const fs = require('fs');
let content = fs.readFileSync('src/pages/Devices.tsx', 'utf8');

const targetStr = '<button \n              onClick={handleAddNew}\n              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm \nfont-medium"\n            >';
// let's just do a simpler replace.

content = content.replace(
    'onClick={handleAddNew}',
    'onClick={handleAddNew}'
);
// that doesn't help. Let's find handleAddNew usage exactly
const idx = content.indexOf('onClick={handleAddNew}');
if (idx > -1) {
    const before = content.substring(0, idx - 25);
    const after = content.substring(idx - 25);
    const newBtn = `
              <button onClick={() => setIsVerifyModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center text-sm font-medium shadow-sm mr-2">
                <CheckCircle className="w-4 h-4 mr-2" /> Xác nhận đã kiểm tra
              </button>`;
    
    fs.writeFileSync('src/pages/Devices.tsx', before + newBtn + after, 'utf8');
    console.log('Successfully injected button');
} else {
    console.log('Could not find onClick={handleAddNew}');
}

