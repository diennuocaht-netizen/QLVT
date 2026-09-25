const XLSX = require('xlsx');
const workbook = XLSX.readFile('Bảng phân ca Đội ĐNCT-2026.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

let headerRowIdx = -1;
let dateColMap = {};

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  let foundDays = 0;
  let tempMap = {};
  
  if (Array.isArray(row)) {
    for (let j = 0; j < row.length; j++) {
      const cellVal = parseInt(row[j]);
      if (!isNaN(cellVal) && cellVal >= 1 && cellVal <= 31) {
        tempMap[cellVal] = j;
        foundDays++;
      }
    }
  }
  
  if (foundDays >= 28) {
    headerRowIdx = i;
    dateColMap = tempMap;
    break;
  }
}

console.log("Header Row Index:", headerRowIdx);
console.log("Date Col Map:", dateColMap);

const names = [];
if (headerRowIdx !== -1) {
  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;
    let foundName = null;
    for (const cell of row) {
      if (typeof cell === 'string' && cell.trim().length > 0) {
        // Just collect all string cells to see what they look like
        if (cell.includes("Nguyễn") || cell.includes("Lê") || cell.includes("Phạm") || cell.includes("Hoàng") || cell.includes("Hoang") || cell.includes("Toàn")) {
           foundName = cell.trim();
           break;
        }
      }
    }
    if (foundName) {
      names.push(foundName);
    }
  }
}

console.log("Names found in file:", names);
