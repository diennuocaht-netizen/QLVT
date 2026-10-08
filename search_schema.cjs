const fs = require('fs');
const content = fs.readFileSync('supabase-migration/01-schema.sql', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex(l => l.includes('CREATE TABLE') && l.includes('inventory_items'));
if(match !== -1) {
    console.log(lines.slice(Math.max(0, match - 2), match + 20).join('\n'));
}
