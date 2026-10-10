const fs = require('fs');
let content = fs.readFileSync('src/pages/InventorySettings.tsx', 'utf8');

if (!content.includes('import Select')) {
  content = content.replace(
    "import * as XLSX from 'xlsx';",
    "import * as XLSX from 'xlsx';\nimport Select from 'react-select';"
  );
  fs.writeFileSync('src/pages/InventorySettings.tsx', content, 'utf8');
}
console.log('Added Select import');
