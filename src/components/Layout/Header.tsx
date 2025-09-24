import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="bg-gradient-to-r from-green-900 via-emerald-700 to-sky-600 text-white shadow-md">
      <div className="px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-white/20 placeholder-white/80 text-white border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/60 focus:bg-white/30 w-48 md:w-64"
              />
            </div>
          </div>

          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-lg md:text-xl font-bold text-white animate-pulse">
              
            </h1>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors" title="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 text-gray-900 text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-white/80 capitalize">{user?.role}</p>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                <span className="text-sm font-semibold text-white">
                  {user?.name?.charAt(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;