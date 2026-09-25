const fs = require('fs');

function updateCanEdit(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /const canEdit = profile\?\.role === 'admin' \|\| profile\?\.role === 'manager';/,
    `const canEdit = true; // Allowed all users to edit`
  );
  fs.writeFileSync(file, content, 'utf8');
}

updateCanEdit('src/pages/Devices.tsx');
updateCanEdit('src/components/DeviceProfileModal.tsx');
console.log('OK');
