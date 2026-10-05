const fs = require('fs');
const filename = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(/C.u h.nh\s*<\/button>/g, '<span className="hidden sm:inline">Cấu hình</span></button>');
content = content.replace(/T.o c.ng vi.c\s*<\/button>/g, '<span className="hidden sm:inline">Tạo công việc</span><span className="sm:hidden">Tạo mới</span></button>');

// make icons smaller
content = content.replace(/<Settings size={18} \/>/g, '<Settings size={16} />');
content = content.replace(/<FileText size={18} \/>/g, '<FileText size={16} />');
content = content.replace(/<Plus size={18} \/>/g, '<Plus size={16} />');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed HRTasks.tsx with wildcard regex');
