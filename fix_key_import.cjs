const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

content = content.replace("import { Key, Outlet,", "import { Outlet,");
content = content.replace("import { LayoutDashboard,", "import { Key, LayoutDashboard,");

fs.writeFileSync('src/components/Layout.tsx', content, 'utf8');
console.log('Fixed Key import');
