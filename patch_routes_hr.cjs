const fs = require('fs');

// Patch App.tsx
let appStr = fs.readFileSync('src/App.tsx', 'utf8');
if (!appStr.includes("import { HRTasks }")) {
    appStr = appStr.replace("import { HREvents } from './pages/HREvents';", "import { HREvents } from './pages/HREvents';\nimport { HRTasks } from './pages/HRTasks';");
    appStr = appStr.replace("<Route path=\"events\" element={<HREvents />} />", "<Route path=\"events\" element={<HREvents />} />\n          <Route path=\"hr-tasks\" element={<HRTasks />} />");
    fs.writeFileSync('src/App.tsx', appStr, 'utf8');
    console.log('App.tsx patched.');
}

// Patch Layout.tsx
let layoutStr = fs.readFileSync('src/components/Layout.tsx', 'utf8');
if (!layoutStr.includes("path: '/hr-tasks'")) {
    if (!layoutStr.includes("ClipboardCheck")) {
        layoutStr = layoutStr.replace("Calendar, UserCheck } from 'lucide-react';", "Calendar, UserCheck, ClipboardCheck } from 'lucide-react';");
    }
    const hrItemsCode = `const hrItems = [
    { path: '/hr-tasks', label: 'Công việc & Giao ca', icon: ClipboardCheck, roles: ['admin', 'manager', 'viewer'] },
    { path: '/shift-schedule', label: 'Phân ca làm việc', icon: Calendar, roles: ['admin', 'manager', 'viewer'] },
    { path: '/events', label: 'Quản lý Sự kiện', icon: Calendar, roles: ['admin', 'manager', 'viewer'] },
  ];`;
    const oldHrItems = /const hrItems = \[[\s\S]*?\];/;
    layoutStr = layoutStr.replace(oldHrItems, hrItemsCode);
    
    // Also patch the active state check in the Layout render
    layoutStr = layoutStr.replace("location.pathname.startsWith('/shift-schedule') || location.pathname.startsWith('/events')", "location.pathname.startsWith('/shift-schedule') || location.pathname.startsWith('/events') || location.pathname.startsWith('/hr-tasks')");
    layoutStr = layoutStr.replace("location.pathname.startsWith('/shift-schedule') || location.pathname.startsWith('/events')", "location.pathname.startsWith('/shift-schedule') || location.pathname.startsWith('/events') || location.pathname.startsWith('/hr-tasks')");
    
    fs.writeFileSync('src/components/Layout.tsx', layoutStr, 'utf8');
    console.log('Layout.tsx patched.');
}
