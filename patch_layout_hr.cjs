const fs = require('fs');
const file = 'src/components/Layout.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add UserCheck
content = content.replace("Menu, X, Briefcase, Calendar } from 'lucide-react';", "Menu, X, Briefcase, Calendar, UserCheck } from 'lucide-react';");

// Add state
content = content.replace(
  "const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);",
  "const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);\n  const [isHrOpen, setIsHrOpen] = useState(false);"
);

// Remove from navItems
content = content.replace(/\{ path: '\/events', label: 'Quản lý Sự kiện', icon: Calendar, roles: \['admin', 'manager', 'viewer'\] \},\r?\n\s*/g, '');
content = content.replace(/\{ path: '\/shift-schedule', label: 'Phân ca làm việc', icon: Calendar, roles: \['admin', 'manager', 'viewer'\] \},\r?\n\s*/g, '');

// Create hrItems
const hrItemsCode = `const hrItems = [
    { path: '/shift-schedule', label: 'Phân ca làm việc', icon: Calendar, roles: ['admin', 'manager', 'viewer'] },
    { path: '/events', label: 'Quản lý Sự kiện', icon: Calendar, roles: ['admin', 'manager', 'viewer'] },
  ];`;
content = content.replace("const deviceItems =", hrItemsCode + "\n\n  const deviceItems =");

// Render HR Section
const hrRender = `{/* HR Section */}
            {profile && hrItems.filter(i => i.roles.includes(profile.role)).length > 0 && (
              <li className="pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsHrOpen(!isHrOpen)}
                  className={clsx(
                    'flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    (location.pathname.startsWith('/shift-schedule') || location.pathname.startsWith('/events')) && !isHrOpen
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-center">
                    <UserCheck className={clsx('mr-3 h-5 w-5', (location.pathname.startsWith('/shift-schedule') || location.pathname.startsWith('/events')) ? 'text-indigo-700' : 'text-gray-400')} />
                    Quản lý Nhân sự
                  </div>
                  {isHrOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                
                {isHrOpen && (
                  <ul className="mt-1 ml-6 space-y-1 border-l-2 border-gray-100 pl-2">
                    {hrItems.filter(i => i.roles.includes(profile.role)).map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            className={clsx(
                              'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            )}
                          >
                            <Icon className={clsx('mr-3 h-4 w-4', isActive ? 'text-indigo-700' : 'text-gray-400')} />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            )}
`;

content = content.replace("{/* Device Section */}", hrRender + "\n            {/* Device Section */}");

fs.writeFileSync(file, content, 'utf8');
console.log('Layout patched with HR Section');
