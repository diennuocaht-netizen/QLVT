const fs = require('fs');
const file = 'src/components/projects/ProjectDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('ListTodo')) {
  content = content.replace(
    "import { X, Calendar, Clock, Phone, Mail, Building, User, FileText, Upload, AlertTriangle, Paperclip, Link as LinkIcon } from 'lucide-react';",
    "import { X, Calendar, Clock, Phone, Mail, Building, User, FileText, Upload, AlertTriangle, Paperclip, Link as LinkIcon, ListTodo } from 'lucide-react';"
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed missing import in Modal');
} else {
  console.log('ListTodo already exists');
}
