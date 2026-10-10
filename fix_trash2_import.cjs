const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

content = content.replace(
  "import { X, Save, Upload, Search, Filter } from 'lucide-react';",
  "import { X, Save, Upload, Search, Filter, Trash2 } from 'lucide-react';"
);

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Fixed missing Trash2 import');
