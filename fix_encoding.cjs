const fs = require('fs');
let content = fs.readFileSync('src/pages/Devices.tsx', 'utf8');

// Fix the corrupted text
content = content.replace(/XAc nh-n `A kim tra/g, 'Xác nhận kiểm tra');
content = content.replace(/ThAm thit b</g, 'Thêm thiết bị');

fs.writeFileSync('src/pages/Devices.tsx', content, 'utf8');
console.log('Fixed encoding');
