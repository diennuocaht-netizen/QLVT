const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Ensure Menu icon is imported
if (!content.includes('Menu,') && !content.includes(', Menu')) {
  content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1, Menu } from 'lucide-react';");
}
if (!content.includes('Package,')) {
  content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1, Package } from 'lucide-react';");
}

// 1. Add pb-16 to main to prevent hiding content under bottom nav
content = content.replace(
  /<main className="flex-1 overflow-y-auto w-full">/,
  '<main className="flex-1 overflow-y-auto w-full pb-16 md:pb-0">'
);

// 2. Add Bottom Navigation before closing div of Layout
const bottomNavStr = `
      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden flex justify-around items-center bg-white border-t border-gray-200 h-16 fixed bottom-0 left-0 right-0 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Link to="/" className={\`flex flex-col items-center justify-center w-full h-full space-y-1 \${location.pathname === '/' ? 'text-indigo-600' : 'text-gray-500'}\`}>
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-medium">Tổng quan</span>
        </Link>
        <Link to="/inventory/items" className={\`flex flex-col items-center justify-center w-full h-full space-y-1 \${location.pathname.startsWith('/inventory') ? 'text-indigo-600' : 'text-gray-500'}\`}>
          <Package className="w-6 h-6" />
          <span className="text-[10px] font-medium">Vật tư</span>
        </Link>
        <Link to="/devices" className={\`flex flex-col items-center justify-center w-full h-full space-y-1 \${location.pathname.startsWith('/devices') ? 'text-indigo-600' : 'text-gray-500'}\`}>
          <Server className="w-6 h-6" />
          <span className="text-[10px] font-medium">Thiết bị</span>
        </Link>
        <Link to="/hr-tasks" className={\`flex flex-col items-center justify-center w-full h-full space-y-1 \${location.pathname.startsWith('/hr') ? 'text-indigo-600' : 'text-gray-500'}\`}>
          <ClipboardCheck className="w-6 h-6" />
          <span className="text-[10px] font-medium">Công việc</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500">
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </div>
  );
};
`;

content = content.replace(/    <\/div>\n  \);\n};\n?$/, bottomNavStr);

fs.writeFileSync('src/components/Layout.tsx', content, 'utf8');
console.log('Added Bottom Navigation to Layout');
