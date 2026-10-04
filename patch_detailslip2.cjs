const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

content = content.replace(
    "if (data) setItems(data as Item[]);",
    "if (data) setItems(data.map(item => itemFromDatabase(item)) as Item[]);"
);

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('DetailSlipModal patched second setItems');
