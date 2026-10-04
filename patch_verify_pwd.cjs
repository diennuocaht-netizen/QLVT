const fs = require('fs');
let content = fs.readFileSync('src/components/VerifyDevicesModal.tsx', 'utf8');

const handleVerifyStart = 'const handleVerify = async () => {';
const newLogic = `const handleVerify = async () => {
    if (selectedIds.size === 0) {
      alert('Vui lòng chọn ít nhất một tủ điện để xác nhận');
      return;
    }
    
    const pwd = window.prompt('Vui lòng nhập mật khẩu xác nhận:');
    if (pwd !== 'dnct@123') {
      alert('Mật khẩu không đúng!');
      return;
    }
`;

content = content.replace(
    /const handleVerify = async \(\) => \{\s*if \(selectedIds\.size === 0\) \{\s*alert\('Vui lòng chọn ít nhất một tủ điện để xác nhận'\);\s*return;\s*\}/,
    newLogic
);

fs.writeFileSync('src/components/VerifyDevicesModal.tsx', content, 'utf8');
console.log('Added password prompt to VerifyDevicesModal.tsx');
