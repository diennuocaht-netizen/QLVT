const fs = require('fs');
const file = 'src/components/projects/ProjectDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Use regex to add BarChart and History to lucide-react imports
const importRegex = /import\s+\{([^}]+)\}\s+from\s+'lucide-react'/;
const match = content.match(importRegex);

if (match) {
  let inner = match[1];
  if (!inner.includes('BarChart')) inner += ', BarChart';
  if (!inner.includes('History')) inner += ', History';
  
  const newImport = `import {${inner}} from 'lucide-react'`;
  content = content.replace(importRegex, newImport);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed imports in ProjectDetailsModal.tsx');
}
