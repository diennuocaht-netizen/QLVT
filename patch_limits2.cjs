const fs = require('fs');

function patchFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let patched = false;
    
    // Replace .select('*') with .select('*').limit(10000) for inventory_items, handling whitespace
    const regex = /supabase[\s\n]*\.from\('inventory_items'\)[\s\n]*\.select\('\*'\)(?!\.limit)/g;
    if (regex.test(content)) {
        content = content.replace(regex, "supabase.from('inventory_items').select('*').limit(10000)");
        patched = true;
    }

    if (patched) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Patched limits (multiline) in', file);
    }
}

const files = [
    'src/pages/InventoryIssues.tsx',
    'src/pages/InventoryReceipts.tsx',
    'src/components/inventory/SlipModal.tsx'
];

files.forEach(f => {
    if (fs.existsSync(f)) patchFile(f);
});
