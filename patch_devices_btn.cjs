const fs = require('fs');
let content = fs.readFileSync('src/pages/Devices.tsx', 'utf8');

content = content.replace(/className="text-indigo-600 hover:text-indigo-900" title="Xem chi tiết"/g, 'className="p-2 -m-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded" title="Xem chi tiết"');
content = content.replace(/className="text-blue-600 hover:text-blue-900" title="Sửa"/g, 'className="p-2 -m-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded" title="Sửa"');
content = content.replace(/className="text-red-600 hover:text-red-900" title="Xóa"/g, 'className="p-2 -m-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded" title="Xóa"');
content = content.replace(/className="w-4 h-4"/g, 'className="w-5 h-5"'); // Replace icon sizes, but only for those buttons! 
// Wait, global replace of w-4 h-4 will break other things.

// Let's do a more targeted replace
const targetBtns = [
  { search: 'className="text-indigo-600 hover:text-indigo-900"', icon: '<Eye className="w-4 h-4"' },
  { search: 'className="text-blue-600 hover:text-blue-900"', icon: '<Edit className="w-4 h-4"' },
  { search: 'className="text-red-600 hover:text-red-900"', icon: '<Trash2 className="w-4 h-4"' }
];

for (const btn of targetBtns) {
  content = content.replace(
    new RegExp(btn.search + '([\\s\\S]*?)' + btn.icon.replace(/<|>/g, '\\$&'), 'g'),
    btn.search.replace('className="', 'className="p-2 -m-2 md:p-1 md:m-0 ') + '$1' + btn.icon.replace('w-4 h-4', 'w-5 h-5')
  );
}

fs.writeFileSync('src/pages/Devices.tsx', content, 'utf8');
console.log('Patched Devices buttons');
