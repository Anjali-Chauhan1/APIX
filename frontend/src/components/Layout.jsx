import Sidebar from './Sidebar';
import Header from './Header';
import { useUIStore } from '../store/uiStore';
import { cn } from '../utils/helpers';

const Layout = ({ children }) => {
  const { isSidebarCollapsed } = useUIStore();

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        isSidebarCollapsed ? "lg:pl-24" : "lg:pl-72"
      )}>
        <Header />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
