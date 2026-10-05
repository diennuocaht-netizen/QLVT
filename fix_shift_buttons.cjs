const fs = require('fs');

const filename = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(filename, 'utf8');

// Action buttons text hide on mobile
content = content.replace(/<Upload className="w-4 h-4 mr-1.5" \/>\s*Nhập Excel/g, '<Upload className="w-4 h-4 sm:mr-1.5" />\n                    <span className="hidden sm:inline">Nhập Excel</span>');
content = content.replace(/<Users className="w-4 h-4 mr-1.5" \/>\s*Đồng bộ NS/g, '<Users className="w-4 h-4 sm:mr-1.5" />\n                    <span className="hidden sm:inline">Đồng bộ NS</span>');
content = content.replace(/<RotateCcw className="w-4 h-4 mr-1.5" \/>\s*Hủy thay đổi/g, '<RotateCcw className="w-4 h-4 sm:mr-1.5" />\n                    <span className="hidden sm:inline">Hủy thay đổi</span>');
content = content.replace(/<Save className="w-4 h-4 mr-1.5" \/>\s*Lưu thay đổi/g, '<Save className="w-4 h-4 sm:mr-1.5" />\n                    <span className="hidden sm:inline">Lưu thay đổi</span>');

// Note: Replace might fail on Vietnamese chars if Node has utf8 issues, let's use wildcards if necessary, but node readFileSync('utf8') works fine.

// Shift Legend
content = content.replace(
  /: \{st.name\} \(\{st.start_time\}-\{st.end_time\}\)/g,
  '<span className="hidden md:inline">: {st.name} </span><span className="hidden lg:inline">({st.start_time}-{st.end_time})</span>'
);

content = content.replace(
  /<span className="text-gray-600">: Nghỉ\/Nghỉ phép<\/span>/g,
  '<span className="text-gray-600 hidden md:inline">: Nghỉ/Nghỉ phép</span>'
);

// Reduce legend padding
content = content.replace(/className="flex items-center text-xs px-2 py-1 border border-gray-200 rounded bg-white"/g, 'className="flex items-center text-xs px-1.5 md:px-2 py-1 border border-gray-200 rounded bg-white"');

// Fix buttons padding and gap
content = content.replace(/className="flex gap-2 shrink-0 flex-wrap"/g, 'className="flex gap-1.5 md:gap-2 shrink-0 flex-wrap"');
content = content.replace(/px-3 py-1.5 rounded-md flex items-center text-sm font-medium/g, 'px-2 md:px-3 py-1.5 rounded-md flex items-center text-sm font-medium');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed buttons and legends');
