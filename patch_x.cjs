const fs = require('fs');
const file = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("History } from 'lucide-react';", "History, X } from 'lucide-react';");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed X import in HRTasks.');
