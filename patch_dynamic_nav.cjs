const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!content.includes('ChevronLeft')) {
  content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1, ChevronLeft, Package } from 'lucide-react';");
}

// 1. Add missing filters
if (!content.includes('filteredHrItems')) {
  content = content.replace(
    /const filteredInventoryItems = [^;]+;/,
    `$&
  const filteredHrItems = hrItems.filter(item => profile && item.roles.includes(profile.role));
  const filteredDeviceItems = deviceItems.filter(item => profile && item.roles.includes(profile.role));`
  );
}

// 2. Replace static bottom nav with dynamic bottom nav
const newBottomNavStr = `
      {/* Bottom Navigation for Mobile (Dynamic Contextual) */}
      <div className="md:hidden flex items-center bg-white border-t border-gray-200 h-16 fixed bottom-0 left-0 right-0 z-40 overflow-x-auto hide-scrollbar snap-x px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {(() => {
          let itemsToRender = [];
          
          if (location.pathname.startsWith('/inventory')) {
            itemsToRender = [
              { path: '/', label: 'Trở về', icon: ChevronLeft, isAction: false, isBack: true },
              ...filteredInventoryItems
            ];
          } else if (location.pathname.startsWith('/devices') || location.pathname.startsWith('/measured-equipments') || location.pathname.startsWith('/measurements')) {
            itemsToRender = [
              { path: '/', label: 'Trở về', icon: ChevronLeft, isAction: false, isBack: true },
              ...filteredDeviceItems
            ];
          } else if (location.pathname.startsWith('/hr') || location.pathname.startsWith('/shift') || location.pathname.startsWith('/events')) {
            itemsToRender = [
              { path: '/', label: 'Trở về', icon: ChevronLeft, isAction: false, isBack: true },
              ...filteredHrItems
            ];
          } else {
            // Main navigation
            itemsToRender = [
              { path: '/', label: 'Tổng quan', icon: LayoutDashboard },
              { path: '/inventory/items', label: 'Vật tư', icon: Package },
              { path: '/devices', label: 'Thiết bị', icon: Server },
              { path: '/hr-tasks', label: 'Công việc', icon: ClipboardCheck },
              { path: 'menu', label: 'Menu', icon: Menu, isAction: true },
            ];
          }

          return itemsToRender.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (!item.isBack && item.path !== '/' && !item.isAction && location.pathname.startsWith(item.path));
            const isMenuAction = item.isAction && item.path === 'menu';
            
            const btnClass = \`snap-center shrink-0 flex flex-col items-center justify-center min-w-[72px] px-2 h-full space-y-1 \${isActive ? 'text-indigo-600' : 'text-gray-500'}\`;

            if (isMenuAction) {
              return (
                <button key="menu-btn" onClick={() => setIsMobileMenuOpen(true)} className={btnClass}>
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{item.label}</span>
                </button>
              );
            }

            return (
              <Link key={item.path + index} to={item.path} className={btnClass}>
                <div className={\`\${item.isBack ? 'bg-gray-100 rounded-full p-1' : ''}\`}>
                  <Icon className={\`\${item.isBack ? 'w-5 h-5 text-gray-700' : 'w-6 h-6'}\`} />
                </div>
                <span className="text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{item.label}</span>
              </Link>
            );
          });
        })()}
      </div>
    </div>
  );
};`;

content = content.replace(
  /\{\/\* Bottom Navigation for Mobile \*\/\}[\s\S]*?(?=<\/div>\s*\);\s*\};\s*$)/,
  newBottomNavStr
);

// We need to make sure the replacement worked. If it failed, it means the regex didn't match.
// Let's use string operations safely.
const startIndex = content.indexOf('{/* Bottom Navigation for Mobile');
if (startIndex !== -1) {
  const endIndex = content.lastIndexOf('</div>');
  const veryEnd = content.indexOf(');', endIndex);
  if (veryEnd !== -1) {
    const startStr = content.substring(0, startIndex);
    content = startStr + newBottomNavStr;
    fs.writeFileSync('src/components/Layout.tsx', content, 'utf8');
    console.log('Successfully injected dynamic bottom nav');
  }
} else {
  console.log('Could not find existing bottom nav');
}

// Add CSS to hide scrollbar
const cssFile = 'src/index.css';
let cssContent = fs.readFileSync(cssFile, 'utf8');
if (!cssContent.includes('hide-scrollbar')) {
  cssContent += `\n\n/* Hide scrollbar for Chrome, Safari and Opera */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}\n`;
  fs.writeFileSync(cssFile, cssContent, 'utf8');
  console.log('Added hide-scrollbar CSS');
}

