const fs = require('fs');
const path = require('path');

function searchInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchInDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Tên biên bản') || content.includes('Thiết bị/Máy móc cần kiểm tra')) {
        console.log(`Found in ${fullPath}`);
      }
    }
  }
}

searchInDir('src');
