const fs = require('fs');
const file = 'src/components/projects/ProjectForm.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { X, UserPlus, Trash2, Plus, Link as LinkIcon } from 'lucide-react';",
  "import { X, UserPlus, Trash2, Plus, Link as LinkIcon, ListTodo } from 'lucide-react';"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed missing import');
