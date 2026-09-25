const fs = require('fs');
const file = 'src/pages/Devices.tsx';
let content = fs.readFileSync(file, 'utf8');

// Set canDelete to false
const oldDeleteFlag = `const canDelete = profile?.role === 'admin';`;
const newDeleteFlag = `const canDelete = false; // profile?.role === 'admin'; // Locked by request`;
content = content.replace(oldDeleteFlag, newDeleteFlag);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
