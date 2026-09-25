const fs = require('fs');
const file = 'src/contexts/AuthContext.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('job_title: string;')) {
  content = content.replace(
    /role: Role;/g,
    "role: Role;\n  job_title?: string;"
  );
  fs.writeFileSync(file, content, 'utf8');
}
console.log('AuthContext updated');
