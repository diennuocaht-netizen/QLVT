const fs = require('fs');

// Patch App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
if (!appContent.includes('HRTaskLog')) {
  appContent = appContent.replace(
    "import { HRTasks } from './pages/HRTasks';", 
    "import { HRTasks } from './pages/HRTasks';\nimport { HRTaskLog } from './pages/HRTaskLog';"
  );
  appContent = appContent.replace(
    "<Route path=\"hr-tasks\" element={<HRTasks />} />", 
    "<Route path=\"hr-tasks\" element={<HRTasks />} />\n            <Route path=\"hr-task-log\" element={<HRTaskLog />} />"
  );
  fs.writeFileSync('src/App.tsx', appContent, 'utf8');
}

// Patch Layout.tsx
let layoutContent = fs.readFileSync('src/components/Layout.tsx', 'utf8');
if (!layoutContent.includes('Nhật ký công việc')) {
  // It might need CheckCircle from lucide-react if not imported
  if (!layoutContent.includes('CheckCircle')) {
    layoutContent = layoutContent.replace(
      "ClipboardCheck } from 'lucide-react';", 
      "ClipboardCheck, CheckCircle } from 'lucide-react';"
    );
  }

  layoutContent = layoutContent.replace(
    "{ path: '/hr-tasks', label: 'Công việc & Giao ca', icon: ClipboardCheck, roles: ['admin', 'manager', 'viewer'] },",
    "{ path: '/hr-tasks', label: 'Công việc & Giao ca', icon: ClipboardCheck, roles: ['admin', 'manager', 'viewer'] },\n    { path: '/hr-task-log', label: 'Nhật ký công việc', icon: CheckCircle, roles: ['admin', 'manager', 'viewer'] },"
  );
  fs.writeFileSync('src/components/Layout.tsx', layoutContent, 'utf8');
}

console.log('Fixed encoding and patched routes safely.');
