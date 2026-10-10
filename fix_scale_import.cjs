const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

content = content.replace(
  "CheckCircle , Package , ChevronLeft } from 'lucide-react';",
  "CheckCircle , Package , ChevronLeft, Scale } from 'lucide-react';"
);

fs.writeFileSync('src/components/Layout.tsx', content, 'utf8');
console.log('Fixed Scale import');
