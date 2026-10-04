const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailRequisitionModal.tsx', 'utf8');

content = content.replace(
    /<th className="px-4 py-3 text-left font-medium text-gray-600">Mã<\/th>\s*<th className="px-4 py-3 text-left font-medium text-gray-600">Tên Vật Tư<\/th>/g,
    '<th className="px-4 py-3 text-left font-medium text-gray-600">Vật Tư</th>'
);

fs.writeFileSync('src/components/inventory/DetailRequisitionModal.tsx', content, 'utf8');
console.log('Fixed headers in DetailRequisitionModal');
