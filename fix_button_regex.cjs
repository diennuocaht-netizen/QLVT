const fs = require('fs');
let content = fs.readFileSync('src/pages/Devices.tsx', 'utf8');
const searchStr = `              <button \n                onClick={handleAddNew}`;
const replaceStr = `              <button onClick={() => setIsVerifyModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center text-sm font-medium shadow-sm mr-2">\n                <CheckCircle className="w-4 h-4 mr-2" /> Xác nhận đã kiểm tra\n              </button>\n              <button \n                onClick={handleAddNew}`;

// fallback regex if spaces differ
const fallbackRegex = /<button[\s\n]+onClick=\{handleAddNew\}/;
const replacement = `<button onClick={() => setIsVerifyModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center text-sm font-medium shadow-sm mr-2">\n                <CheckCircle className="w-4 h-4 mr-2" /> Xác nhận đã kiểm tra\n              </button>\n              <button \n                onClick={handleAddNew}`;

if (content.includes(searchStr)) {
    content = content.replace(searchStr, replaceStr);
} else {
    content = content.replace(fallbackRegex, replacement);
}

fs.writeFileSync('src/pages/Devices.tsx', content, 'utf8');
console.log('Fixed button!');
