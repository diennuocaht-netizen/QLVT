const XLSX = require('xlsx');
const fs = require('fs');

try {
  const filePath = 'd:\\Project\\Quản lý vật tư và tài liệu\\Tổng hợp Nhập - Xuất - Tồn_2025.xls';
  const workbook = XLSX.readFile(filePath);
  
  const sheetName = workbook.SheetNames[0];
  console.log(`Sheet name: ${sheetName}`);
  
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // read as array of arrays
  
  console.log(`Total rows: ${json.length}`);
  
  // Print first 10 rows to understand the structure
  for (let i = 0; i < Math.min(15, json.length); i++) {
    console.log(`Row ${i + 1}: ${JSON.stringify(json[i])}`);
  }
} catch (error) {
  console.error('Error reading file:', error);
}
