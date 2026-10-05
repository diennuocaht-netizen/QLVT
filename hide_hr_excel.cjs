const fs = require('fs');

const filename = 'src/pages/HRTaskLog.tsx';
if (fs.existsSync(filename)) {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replace(
    /className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-600/g,
    'className="hidden md:inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-600'
  );
  fs.writeFileSync(filename, content, 'utf8');
}
console.log('Hid Excel on mobile');
