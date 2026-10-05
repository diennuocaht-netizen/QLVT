const fs = require('fs');

const filename = 'src/components/Layout.tsx';
let content = fs.readFileSync(filename, 'utf8');

// Replace the main navigation array
content = content.replace(/itemsToRender = \[\s*\{ path: '\/', label: 'Tổng quan', icon: LayoutDashboard \},\s*\{ path: '\/inventory\/items', label: 'Vật tư', icon: Package \},\s*\{ path: '\/devices', label: 'Thiết bị', icon: Server \},\s*\{ path: '\/hr-tasks', label: 'Công việc', icon: ClipboardCheck \},\s*\{ path: 'menu', label: 'Menu', icon: Menu, isAction: true \},\s*\];/g, 
`itemsToRender = [
              { path: '/', label: 'Tổng quan', icon: LayoutDashboard },
              { path: '/projects', label: 'Dự án', icon: Briefcase },
              { path: '/documents', label: 'Tài liệu', icon: FileText },
              { path: '/inventory/items', label: 'Vật tư', icon: Package },
              { path: '/devices', label: 'Thiết bị', icon: Server },
              { path: '/hr-tasks', label: 'Công việc', icon: ClipboardCheck },
              { path: 'menu', label: 'Menu', icon: Menu, isAction: true },
            ];`);

fs.writeFileSync(filename, content, 'utf8');
console.log('Added Projects and Documents to bottom nav');
