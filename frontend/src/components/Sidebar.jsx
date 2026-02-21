import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Target, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  LayoutDashboard,
  Compass,
  Settings,
  HelpCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Calculator,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { cn } from '../utils/helpers';

const SidebarLink = ({ to, icon: Icon, label, isCollapsed, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname + location.search === to || 
                   (to === '/dashboard?tab=overview' && location.pathname === '/dashboard' && !location.search);

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
        isActive 
          ? "bg-primary-600 text-white shadow-lg shadow-primary-200" 
          : "text-gray-500 hover:bg-primary-50 hover:text-primary-600"
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0", isCollapsed ? "mx-auto" : "")} />
      {!isCollapsed && <span className="font-semibold text-sm">{label}</span>}
      {isCollapsed && (
        <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 font-medium">
          {label}
        </div>
      )}
    </NavLink>
  );
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isSidebarCollapsed: isCollapsed, toggleSidebar } = useUIStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { to: '/dashboard?tab=overview', icon: LayoutDashboard, label: 'Overview' },
    { to: '/dashboard?tab=simulator', icon: Calculator, label: 'Pension Simulator' },
    { to: '/dashboard?tab=scenarios', icon: Target, label: 'Scenarios' },
    { to: '/dashboard?tab=montecarlo', icon: TrendingUp, label: 'Monte Carlo' },
    { to: '/dashboard?tab=timeline', icon: Compass, label: 'Timeline' },
    { to: '/dashboard?tab=protection', icon: ShieldCheck, label: 'Family Protection' },
    { to: '/goal-planning', icon: Target, label: 'Goal Planning' },
  ];

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '-100%', opacity: 0 },
    desktop: { x: 0, opacity: 1 },
  };

  return (
    <>
      {/* Mobile Hamburger */}
      {isMobile && (
        <button
          className="fixed top-3 left-3 z-50 p-2 bg-white rounded-lg shadow-md sm:hidden"
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={isMobile ? (isOpen ? "open" : "closed") : "desktop"}
        variants={sidebarVariants}
        className={cn(
          "fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-40 transition-all duration-300 transform lg:translate-x-0 lg:opacity-100 shadow-xl lg:shadow-none translate-y-0",
          isCollapsed ? "w-24" : "w-72"
        )}
      >
        <div className="flex flex-col h-full p-4 xs:p-6">
          {/* Logo Section */}
          <div className="flex items-center justify-between mb-8 xs:mb-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2.5 rounded-2xl shadow-lg shadow-primary-200">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tight bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    PensionSaarthi
                  </span>
                  <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full w-fit">
                    PRO v1.2
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary-600 transition-colors"
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hide -mx-2 px-2 pb-4">
            {!isCollapsed && <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-4">Menu</p>}
            {navItems.map((item) => (
              <SidebarLink
                key={item.to}
                {...item}
                isCollapsed={isCollapsed}
                onClick={() => setIsOpen(false)}
              />
            ))}
            
            {!isCollapsed && (
              <div className="pt-8 space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-4">Support</p>
                <div className="flex items-center gap-4 px-4 py-3 text-gray-500 hover:text-primary-600 cursor-not-allowed group">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-semibold text-sm">Market Insights</span>
                    <span className="ml-auto text-[8px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">SOON</span>
                </div>
              </div>
            )}
          </nav>

          {/* Bottom Section: User Profile */}
          <div className="mt-auto relative pt-4 border-t border-gray-100 shrink-0">
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={cn(
                    "absolute bottom-full left-0 w-full mb-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50",
                    isCollapsed ? "min-w-[12rem]" : ""
                  )}
                >
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-all group"
                    >
                      <User className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
                      View Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all group"
                    >
                      <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
               onClick={(e) => {
                 e.preventDefault();
                 setShowUserMenu(!showUserMenu);
               }}
               className={cn(
                "w-full flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-gray-50 group border border-transparent",
                showUserMenu ? "bg-gray-50 border-gray-100" : "",
                isCollapsed ? "justify-center" : "bg-white"
            )}>
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-primary-200 shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                  </div>
                  {showUserMenu ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
