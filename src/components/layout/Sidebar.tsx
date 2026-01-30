import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  History, 
  Download,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/streamers', label: 'Streamers', icon: Users },
  { path: '/history', label: 'Histórico', icon: History },
  { path: '/export', label: 'Exportar', icon: Download },
];

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <img 
          src="/bloom-agency.svg" 
          alt="Bloom Agency" 
          className="h-10 w-auto mx-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent",
                isActive && "bg-sidebar-accent text-sidebar-primary border-l-2 border-sidebar-primary"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70"
              )} />
              <span className={cn(
                "font-medium",
                isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70"
              )}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Mobile Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={cn(
          "fixed top-0 left-0 h-full w-64 bg-sidebar z-50 transform transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4"
          >
            <X className="h-5 w-5" />
          </Button>
          <SidebarContent />
        </aside>
      </>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
      <SidebarContent />
    </aside>
  );
}
