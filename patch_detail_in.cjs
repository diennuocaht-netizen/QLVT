const fs = require('fs');

let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

// The original loadAndSubscribe logic:
// const { data } = await supabase.from('inventory_items').select('*').limit(10000);
// if (data) setItems(data.map(item => itemFromDatabase(item)) as Item[]);

const regex = /const \{ data \} = await supabase\.from\('inventory_items'\)\.select\('\*'\)(?:\.limit\(\d+\))?;/g;

content = content.replace(regex, `
        const itemIds = slip?.items.map(i => i.itemId).filter(Boolean) || [];
        const { data } = await supabase.from('inventory_items').select('*').in('id', itemIds);
`);

// The subscription reload logic:
// supabase.from('inventory_items').select('*').limit(10000).then(({ data }) => {
const subRegex = /supabase\.from\('inventory_items'\)\.select\('\*'\)(?:\.limit\(\d+\))?\.then/g;
content = content.replace(subRegex, `
              const currentIds = slip?.items.map(i => i.itemId).filter(Boolean) || [];
              supabase.from('inventory_items').select('*').in('id', currentIds).then
`);

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('Patched DetailSlipModal with .in query');
