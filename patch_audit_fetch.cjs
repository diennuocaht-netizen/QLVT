const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailAuditModal.tsx', 'utf8');

content = content.replace(
    /const \{ data: invData, error: invError \} = await supabase\s*\.from\('inventory_items'\)\s*\.select\('\*'\)\s*\.in\('id', itemIds\);/g,
    `const { data: invData, error: invError } = await supabase
              .from('inventory_items')
              .select('*')
              .limit(10000); // Fetch all to avoid URI Too Long error with .in()`
);

fs.writeFileSync('src/components/inventory/DetailAuditModal.tsx', content, 'utf8');
console.log('Patched DetailAuditModal.tsx to fetch all items');
