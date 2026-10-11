const fs = require('fs');
const files = [
  'media_1791108991464.png',
  'media_1791109970072.png',
  'media_1791119621446.png',
  'media_1791163239329.png',
  'media_1791164066857.png',
  'media_1791166861681.png',
  'media_1791167556170.png'
];
const dir = 'C:/Users/HOANG TOAN/.gemini/antigravity/brain/d33df75b-db3a-424f-bdef-9c3f1b55baed/.user_uploaded/';
files.forEach(f => {
  const p = dir + f;
  if (fs.existsSync(p)) {
    const stat = fs.statSync(p);
    console.log(f, stat.size);
  }
});
