const fs = require('fs');

function addLog(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
        /const \{ data \} = await supabase\.from\('inventory_items'\)\.select\('\*'\)\.in\('id', itemIds\);/g,
        `const { data, error } = await supabase.from('inventory_items').select('*').in('id', itemIds);
          console.log('Fetched items for IDs', itemIds, 'Result:', data, 'Error:', error);`
    );
    fs.writeFileSync(file, content, 'utf8');
}

addLog('src/components/inventory/DetailSlipModal.tsx');
addLog('src/components/inventory/DetailRequisitionModal.tsx');
console.log('Added fetch debug logs');
