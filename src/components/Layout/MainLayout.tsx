import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  console.log('MainLayout: Rendering with children:', !!children);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex h-screen">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 flex flex-col">
          <Header toggleSidebar={toggleSidebar} />
          <main className="flex-1 pl-0 lg:pl-4 xl:pl-6 pr-3 sm:pr-4 md:pr-6 py-3 sm:py-4 md:py-6 overflow-auto dashboard-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;