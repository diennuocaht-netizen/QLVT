const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

content = content.replace(
    /supabase\.from\('hr_events'\)\.select\('id', \{ count: 'exact', head: true \}\)\.eq\('status', 'in_progress'\)/g,
    `supabase.from('hr_events').select('id', { count: 'exact', head: true }).in('status', ['ongoing', 'upcoming'])`
);

fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
console.log('Fixed fetchStats in Dashboard.tsx');
