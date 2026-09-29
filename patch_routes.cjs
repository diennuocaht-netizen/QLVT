const fs = require('fs');

// Patch App.tsx
let appStr = fs.readFileSync('src/App.tsx', 'utf8');
if (!appStr.includes("import { HREvents }")) {
    appStr = appStr.replace("import { ShiftSchedule } from './pages/ShiftSchedule';", "import { ShiftSchedule } from './pages/ShiftSchedule';\nimport { HREvents } from './pages/HREvents';");
    appStr = appStr.replace("<Route path=\"shift-schedule\" element={<ShiftSchedule />} />", "<Route path=\"shift-schedule\" element={<ShiftSchedule />} />\n          <Route path=\"events\" element={<HREvents />} />");
    fs.writeFileSync('src/App.tsx', appStr, 'utf8');
    console.log('App.tsx patched.');
}

// Patch Layout.tsx
let layoutStr = fs.readFileSync('src/components/Layout.tsx', 'utf8');
if (!layoutStr.includes("path: '/events'")) {
    const navItemsRe = /const navItems = \[[\s\S]*?\];/;
    const match = layoutStr.match(navItemsRe);
    if (match) {
        let itemsStr = match[0];
        // Insert right after ShiftSchedule or Projects
        itemsStr = itemsStr.replace("{ path: '/shift-schedule', label: 'PhAn ca lAm vic'", "{ path: '/events', label: 'Qun lA S kin', icon: Calendar, roles: ['admin', 'manager', 'viewer'] },\n    { path: '/shift-schedule', label: 'PhAn ca lAm vic'");
        // Handle normal encoding
        itemsStr = itemsStr.replace("{ path: '/shift-schedule', label: 'Phân ca làm việc'", "{ path: '/events', label: 'Quản lý Sự kiện', icon: Calendar, roles: ['admin', 'manager', 'viewer'] },\n    { path: '/shift-schedule', label: 'Phân ca làm việc'");
        
        layoutStr = layoutStr.replace(navItemsRe, itemsStr);
        fs.writeFileSync('src/components/Layout.tsx', layoutStr, 'utf8');
        console.log('Layout.tsx patched.');
    }
}
