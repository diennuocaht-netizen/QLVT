const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

content = content.replace(
    /<span className="font-semibold">\{act\.user_name \|\| act\.user_email\?\.split\('@'\)\[0\] \|\| 'Hệ thống'\}<\/span> \{actText\} <span className="font-semibold">\{entity\}<\/span>/g,
    `<span className="font-semibold">{act.user_name || act.user_email?.split('@')[0] || 'Hệ thống'}</span> {actText} <span className="font-semibold">{entity}</span>
                            {act.details && (act.details.name || act.details.title || act.details.code) && (
                              <span className="text-gray-600 font-medium"> ({act.details.code ? act.details.code + ' - ' : ''}{act.details.name || act.details.title})</span>
                            )}`
);

fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
console.log('Fixed Activity log display in Dashboard.tsx');
