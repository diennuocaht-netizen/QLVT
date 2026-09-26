const fs = require('fs');
const file = 'src/components/projects/ProjectDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const importRegex = /import \{([^}]+)\} from 'lucide-react';/;
const match = content.match(importRegex);
if (match) {
  let imports = match[1];
  if (!imports.includes('ListTodo')) {
    imports += ', ListTodo';
    content = content.replace(importRegex, `import {${imports}} from 'lucide-react';`);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed missing import in Modal via regex');
  } else {
    console.log('ListTodo actually exists in imports');
  }
}
