import React from 'react';
import ExportDropdown from './ExportDropdown';
import { useAuthStore } from '../store/authStore';
import { Bell, Search } from 'lucide-react';

const Header = () => {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-gray-100 bg-white/80 px-2 sm:px-4 md:px-8 backdrop-blur-md">
      <div className="flex flex-1 items-center gap-2 sm:gap-4">
        <div className="hidden lg:flex relative items-center max-w-md w-full">
          <Search className="absolute left-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projections, scenarios..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
        <div className="hidden xs:flex items-center gap-2 pr-2 sm:pr-4 border-r border-gray-100">
          <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
            <Bell className="w-5 h-5" />
          </button>
        </div>
        <ExportDropdown />
      </div>
    </header>
  );
};

export default Header;
