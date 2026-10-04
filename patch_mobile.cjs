const fs = require('fs');
let content = fs.readFileSync('src/pages/InventoryAudits.tsx', 'utf8');

// Replace the button in the mobile view
content = content.replace(
    /<button className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md" title="Chi tiết">/g,
    `<button onClick={() => { setSelectedAudit(audit); setIsDetailModalOpen(true); }} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md" title="Chi tiết">`
);

fs.writeFileSync('src/pages/InventoryAudits.tsx', content, 'utf8');
console.log('Added onClick to mobile view in InventoryAudits.tsx');
