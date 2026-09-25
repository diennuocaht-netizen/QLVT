const XLSX = require('xlsx');
const workbook = XLSX.readFile('Bảng phân ca Đội ĐNCT-2026.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  if (Array.isArray(row)) {
    for (const cell of row) {
      if (typeof cell === 'string' && cell.includes("Hoàng Văn Toàn")) {
        console.log("Found Hoàng Văn Toàn at row", i);
        console.log(JSON.stringify(row));
      }
    }
  }
}
