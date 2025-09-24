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
  Building2,
  CheckSquare,
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
    { icon: Building2, label: 'Departments', path: '/departments', roles: ['admin'] },
    { icon: Users, label: 'Students', path: '/students', roles: ['admin', 'teacher'] },
    { icon: GraduationCap, label: 'Teachers', path: '/teachers', roles: ['admin'] },
    { icon: UserCheck, label: 'Guest Teachers', path: '/guest-teachers', roles: ['admin'] },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
    { icon: BookOpen, label: 'Subjects', path: '/subjects', roles: ['admin', 'teacher'] },
    { icon: CheckSquare, label: 'Attendance', path: '/attendance' },
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
        className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 sm:w-70 bg-gradient-to-b from-gray-600 via-gray-700 to-black text-white backdrop-blur-xl border-r border-white/10 shadow-xl z-50 lg:static lg:translate-x-0 lg:top-0 lg:h-full"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 border border-white/30 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h2 className="text-base md:text-lg font-bold text-white">PMS</h2>
                  <p className="text-xs text-white/80">Management System</p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
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
                          ? 'bg-white/20 text-white shadow-md ring-1 ring-white/30'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
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
          <div className="p-3 md:p-4 border-t border-white/10">
            <button
              onClick={logout}
              className="flex items-center space-x-2 md:space-x-3 w-full px-3 md:px-4 py-2 md:py-3 text-white/90 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200"
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