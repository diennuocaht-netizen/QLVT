const fs = require('fs');
const file = 'src/components/DeviceProfileModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /details: \{ name: formData\.name, code: formData\.code \}/;
const replacement = "details: { name: formData.name, code: formData.code, changes: updatedChangeLogs[updatedChangeLogs.length - 1].details }";

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched logActivity details!');
} else {
    console.log('Regex failed');
}
