const fs = require('fs');
const filename = 'src/pages/HREvents.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(
  /className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm font-medium transition-colors"[\s\S]*?>[\s\S]*?<Plus size=\{18\} \/>[\s\S]*?T\?o s\? ki\?n[\s\S]*?<\/button>/,
  `className="inline-flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Tạo sự kiện</span><span className="sm:hidden">Tạo mới</span>
            </button>`
);

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed HREvents.tsx');
