const fs = require('fs');
const filename = 'src/pages/InventorySettings.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(
  /handleFirestoreError\(err, OperationType\.CREATE, 'inventory_cost_codes'\);/g,
  "alert(`Lỗi thêm mã: ${(err as any).message || JSON.stringify(err)}`); handleFirestoreError(err, OperationType.CREATE, 'inventory_cost_codes');"
);

fs.writeFileSync(filename, content, 'utf8');
console.log('Added alert for add cost code');
