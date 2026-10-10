const fs = require('fs');

// 1. Update App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
if (!appContent.includes('InventoryReconciliations')) {
  appContent = appContent.replace(
    "import { InventorySettings } from './pages/InventorySettings';",
    "import { InventorySettings } from './pages/InventorySettings';\nimport { InventoryReconciliations } from './pages/InventoryReconciliations';"
  );
  
  // Add route
  appContent = appContent.replace(
    "<Route path=\"inventory/audits\" element={<InventoryAudits />} />",
    "<Route path=\"inventory/audits\" element={<InventoryAudits />} />\n            <Route path=\"inventory/reconciliations\" element={<InventoryReconciliations />} />"
  );
  fs.writeFileSync('src/App.tsx', appContent, 'utf8');
}

// 2. Update Layout.tsx
let layoutContent = fs.readFileSync('src/components/Layout.tsx', 'utf8');
if (!layoutContent.includes('/inventory/reconciliations')) {
  layoutContent = layoutContent.replace(
    "{ path: '/inventory/audits', label: 'Kim kA', icon: ClipboardList, roles: ['admin', 'manager'] },",
    "{ path: '/inventory/audits', label: 'Kiểm kê (Cũ)', icon: ClipboardList, roles: ['admin', 'manager'] },\n    { path: '/inventory/reconciliations', label: 'Đối soát Bravo', icon: ClipboardList, roles: ['admin', 'manager'] },"
  );
  // Also correct any encoding issues if found, but regex replace might fail if exact string mismatch. Let's use a safer regex.
  layoutContent = layoutContent.replace(
    /\{\s*path:\s*'\/inventory\/audits',[^}]+\},/,
    "{ path: '/inventory/audits', label: 'Kiểm kê', icon: ClipboardList, roles: ['admin', 'manager'] },\n    { path: '/inventory/reconciliations', label: 'Đối soát Bravo', icon: Scale, roles: ['admin', 'manager'] },"
  );
  
  if (!layoutContent.includes('Scale')) {
    layoutContent = layoutContent.replace(
      "import { \n  LogOut,",
      "import { \n  LogOut,\n  Scale,"
    );
  }

  fs.writeFileSync('src/components/Layout.tsx', layoutContent, 'utf8');
}

console.log('App and Layout updated');
