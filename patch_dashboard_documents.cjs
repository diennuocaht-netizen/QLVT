const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

content = content.replace(
    /supabase\.from\('iso_documents'\)\.select/g,
    `supabase.from('documents').select`
);

fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
console.log('Fixed ISO documents fetch in Dashboard.tsx');
