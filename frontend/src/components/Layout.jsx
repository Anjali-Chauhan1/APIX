import Sidebar from './Sidebar';
import Header from './Header';
import { useUIStore } from '../store/uiStore';
import { cn } from '../utils/helpers';

const Layout = ({ children }) => {
  const { isSidebarCollapsed } = useUIStore();

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-gray-50 font-sans w-full min-w-0">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 w-full min-w-0",
        isSidebarCollapsed ? "lg:pl-24" : "lg:pl-72"
      )}>
        <Header />
        <main className="flex-1 overflow-x-auto w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
