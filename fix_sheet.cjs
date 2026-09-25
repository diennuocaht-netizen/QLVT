const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update Excel import to ask for Sheet
content = content.replace(
  "const sheetName = workbook.SheetNames[0]; // read first sheet",
  `const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        let sheetName = workbook.SheetNames[0];
        if (workbook.SheetNames.length > 1) {
          // Try to guess sheet
          const guess = workbook.SheetNames.find(s => {
            const sn = s.toLowerCase().replace(/\\s/g, '');
            return sn.includes(\`t\${month}\`) && sn.includes(\`\${year}\`);
          });
          
          let listStr = workbook.SheetNames.map((s, idx) => \`\${idx + 1}. \${s}\`).join('\\n');
          // if too long, truncate
          if (listStr.length > 300) {
            listStr = listStr.substring(0, 300) + '\\n... (còn nữa)';
          }
          
          const guessIndex = guess ? workbook.SheetNames.indexOf(guess) + 1 : 1;
          const userInput = window.prompt(\`File Excel có \${workbook.SheetNames.length} Sheets.\\nHệ thống dự đoán bạn muốn nhập dữ liệu cho tháng \${month}/\${year}.\\n\\nDanh sách Sheets:\\n\${listStr}\\n\\nVui lòng nhập SỐ THỨ TỰ của Sheet bạn muốn import:\`, guessIndex.toString());
          
          if (!userInput) return; // cancel
          const selIdx = parseInt(userInput) - 1;
          if (isNaN(selIdx) || selIdx < 0 || selIdx >= workbook.SheetNames.length) {
            alert('Số thứ tự không hợp lệ!');
            return;
          }
          sheetName = workbook.SheetNames[selIdx];
        }`
);

// Enhance exact match to handle multiple spaces
content = content.replace(
  "const empNameStr = removeAccents(e.full_name).toLowerCase().trim();",
  "const empNameStr = removeAccents(e.full_name).toLowerCase().trim().replace(/\\s+/g, ' ');"
);
content = content.replace(
  "const nameStr = removeAccents(name).toLowerCase();",
  "const nameStr = removeAccents(name).toLowerCase().trim().replace(/\\s+/g, ' ');"
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
