const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

content = content.replace(/, ChevronLeft, Package/, ', ChevronLeft');

fs.writeFileSync('src/components/Layout.tsx', content, 'utf8');
console.log('Fixed duplicate import');
