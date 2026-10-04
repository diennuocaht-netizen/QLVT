const fs = require('fs');
let content = fs.readFileSync('src/pages/InventoryAudits.tsx', 'utf8');

if (!content.includes('DetailAuditModal')) {
    // Add import
    content = content.replace(
        "import { AuditModal } from '../components/inventory/AuditModal';",
        "import { AuditModal } from '../components/inventory/AuditModal';\nimport { DetailAuditModal } from '../components/inventory/DetailAuditModal';"
    );
    
    // Add state
    content = content.replace(
        "const [isModalOpen, setIsModalOpen] = useState(false);",
        "const [isModalOpen, setIsModalOpen] = useState(false);\n  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);\n  const [selectedAudit, setSelectedAudit] = useState<InventoryAudit | null>(null);"
    );
    
    // Add onClick handler for view button
    content = content.replace(
        /<button className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Chi tiết">/g,
        `<button onClick={() => { setSelectedAudit(audit); setIsDetailModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Chi tiết">`
    );
    
    // Add component render
    content = content.replace(
        "      <AuditModal",
        "      <DetailAuditModal\n        isOpen={isDetailModalOpen}\n        onClose={() => setIsDetailModalOpen(false)}\n        audit={selectedAudit}\n      />\n\n      <AuditModal"
    );
    
    fs.writeFileSync('src/pages/InventoryAudits.tsx', content, 'utf8');
    console.log('Patched InventoryAudits.tsx');
}
