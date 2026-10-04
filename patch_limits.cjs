const fs = require('fs');

function patchFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let patched = false;
    
    // Replace .select('*') with .select('*').limit(10000) for inventory_items
    const regex = /supabase\.from\('inventory_items'\)\.select\('\*'\)(?!\.limit)/g;
    if (regex.test(content)) {
        content = content.replace(regex, "supabase.from('inventory_items').select('*').limit(10000)");
        patched = true;
    }

    if (patched) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Patched limits in', file);
    }
}

const files = [
    'src/components/inventory/DetailSlipModal.tsx',
    'src/components/inventory/DetailRequisitionModal.tsx',
    'src/components/inventory/AuditModal.tsx',
    'src/components/inventory/PrintRequisitionModal.tsx',
    'src/pages/InventoryDashboard.tsx',
    'src/pages/InventoryItems.tsx',
    'src/pages/InventoryIssues.tsx',
    'src/pages/InventoryReceipts.tsx'
];

files.forEach(f => {
    if (fs.existsSync(f)) patchFile(f);
});

// Also remove the debug UI from DetailSlipModal.tsx
let detailContent = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');
const debugRegex = /<h3 className="text-lg font-semibold text-gray-900 mb-4">[\s\S]*?<\/h3>/;
if (debugRegex.test(detailContent)) {
    detailContent = detailContent.replace(debugRegex, '<h3 className="text-lg font-semibold text-gray-900 mb-4">Danh sách vật tư</h3>');
    fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', detailContent, 'utf8');
    console.log('Removed debug UI from DetailSlipModal.tsx');
}
