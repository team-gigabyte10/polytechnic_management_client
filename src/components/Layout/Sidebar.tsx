import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Calendar,
  BookOpen,
  ClipboardList,
  Banknote,
  Bell,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [isLg, setIsLg] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
      setIsLg(matches);
    };
    setIsLg(mql.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange as unknown as EventListener);
    } else {
      // @ts-ignore deprecated Safari
      mql.addListener(handleChange as any);
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handleChange as unknown as EventListener);
      } else {
        // @ts-ignore deprecated Safari
        mql.removeListener(handleChange as any);
      }
    };
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Students', path: '/students', roles: ['admin', 'teacher'] },
    { icon: GraduationCap, label: 'Teachers', path: '/teachers', roles: ['admin'] },
    { icon: UserCheck, label: 'Guest Teachers', path: '/guest-teachers', roles: ['admin'] },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
    { icon: BookOpen, label: 'Courses', path: '/courses', roles: ['admin', 'teacher'] },
    { icon: ClipboardList, label: 'Marks', path: '/marks', roles: ['admin', 'teacher'] },
    { icon: Banknote, label: 'Accounts', path: '/accounts', roles: ['admin'] },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: isLg ? 0 : -280 }}
        animate={{ x: isLg ? 0 : (isOpen ? 0 : -280) }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full w-64 sm:w-70 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl z-50 lg:static lg:translate-x-0"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h2 className="text-base md:text-lg font-bold text-gray-900">PMS</h2>
                  <p className="text-xs text-gray-600">Management System</p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="p-3 md:p-4 border-b border-gray-200/50">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 md:p-4">
            <ul className="space-y-1 md:space-y-2">
              {filteredMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={`flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100/80 hover:text-blue-600'
                      }`}
                    >
                      <item.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                      <span className="text-xs md:text-sm font-medium">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-3 md:p-4 border-t border-gray-200/50">
            <button
              onClick={logout}
              className="flex items-center space-x-2 md:space-x-3 w-full px-3 md:px-4 py-2 md:py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;