const fs = require('fs');

const files = [
  'src/pages/HREvents.tsx',
  'src/pages/ShiftSchedule.tsx',
  'src/pages/HRTaskLog.tsx'
];

files.forEach(filename => {
  if (fs.existsSync(filename)) {
    let content = fs.readFileSync(filename, 'utf8');
    // Change padding and text size to be smaller on mobile
    content = content.replace(/px-3 py-1.5 text-sm/g, 'px-2 md:px-3 py-1.5 text-xs md:text-sm');
    // Hide text for "Tạo sự kiện" in HREvents
    content = content.replace(/<Plus size={18} \/>\n\s*T.o s. ki.n/g, '<Plus size={16} />\n            <span className="hidden sm:inline">Tạo sự kiện</span><span className="sm:hidden">Tạo mới</span>');
    fs.writeFileSync(filename, content, 'utf8');
  }
});
console.log('Fixed other files padding');
