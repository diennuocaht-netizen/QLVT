import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FileText, Server, Users, LogOut, Box, ArrowDownToLine, ArrowUpFromLine, ClipboardList, ChevronDown, ChevronRight, Settings, Menu, X } from 'lucide-react';
import clsx from 'clsx';

export const Layout: React.FC = () => {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Tổng quan', icon: LayoutDashboard, roles: ['admin', 'manager', 'viewer'] },
    { path: '/documents', label: 'Tài liệu ISO', icon: FileText, roles: ['admin', 'manager', 'viewer'] },
    { path: '/devices', label: 'Thiết bị', icon: Server, roles: ['admin', 'manager', 'viewer'] },
    { path: '/admin', label: 'Quản trị', icon: Users, roles: ['admin'] },
  ];

  const inventoryItems = [
    { path: '/inventory', label: 'Tổng quan Vật tư', icon: LayoutDashboard, roles: ['admin', 'manager', 'viewer'] },
    { path: '/inventory/items', label: 'Danh mục Vật tư', icon: Box, roles: ['admin', 'manager', 'viewer'] },
    { path: '/inventory/receipts', label: 'Phiếu Nhập Kho', icon: ArrowDownToLine, roles: ['admin', 'manager', 'viewer'] },
    { path: '/inventory/issues', label: 'Phiếu Xuất Kho', icon: ArrowUpFromLine, roles: ['admin', 'manager', 'viewer'] },
    { path: '/inventory/requisitions', label: 'Tờ Trình', icon: ClipboardList, roles: ['admin', 'manager', 'viewer'] },
    { path: '/inventory/audits', label: 'Kiểm kê', icon: ClipboardList, roles: ['admin', 'manager'] },
    { path: '/inventory/settings', label: 'Cài đặt Vật tư', icon: Settings, roles: ['admin', 'manager'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  const filteredInventoryItems = inventoryItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  const isInventoryActive = location.pathname.startsWith('/inventory');

  return (
    <div className="flex h-screen bg-gray-50 flex-col md:flex-row overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4 flex-shrink-0 z-20">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="Logo" className="h-8 w-auto" />
          <h1 className="text-lg font-bold text-indigo-600">DNCT Hub</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-40 transform transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold text-indigo-600">DNCT Hub</h1>
          </div>
          <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {filteredNavItems.map((item) => {
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
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className={clsx('mr-3 h-5 w-5', isActive ? 'text-indigo-700' : 'text-gray-400')} />
                    {item.label}
                  </Link>
                </li>
              );
            })}

            {/* Inventory Section */}
            {filteredInventoryItems.length > 0 && (
              <li className="pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                  className={clsx(
                    'flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isInventoryActive && !isInventoryOpen
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-center">
                    <Box className={clsx('mr-3 h-5 w-5', isInventoryActive ? 'text-indigo-700' : 'text-gray-400')} />
                    Quản lý Vật tư
                  </div>
                  {isInventoryOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                
                {isInventoryOpen && (
                  <ul className="mt-1 ml-6 space-y-1 border-l-2 border-gray-100 pl-2">
                    {filteredInventoryItems.map((item) => {
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
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{profile?.displayName || 'User'}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
