const fs = require('fs');
const content = fs.readFileSync('src/supabase-client.ts', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('VITE_SUPABASE_URL'));
if(start !== -1) {
    console.log(lines.slice(Math.max(0, start - 2), start + 5).join('\n'));
}
