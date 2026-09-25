const fs = require('fs');
const file = 'src/pages/Devices.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `const canDelete = false; // profile?.role === 'admin'; // Locked by request`,
  `const canDelete = profile?.role === 'admin';`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Reverted Devices.tsx');
