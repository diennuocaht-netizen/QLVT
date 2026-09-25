const XLSX = require('xlsx');
const workbook = XLSX.readFile('Bảng phân ca Đội ĐNCT-2026.xlsx');
console.log(workbook.SheetNames);
