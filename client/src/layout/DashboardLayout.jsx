import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { useAuth } from '@/hooks/useAuth';

const SIDEBAR_STORAGE_KEY = 'crts_sidebar_collapsed';

export function DashboardLayout() {
  const [isNavigationOpen, setNavigationOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true',
  );
  const { logout, user } = useAuth();

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(!current));
      return !current;
    });
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <AppSidebar
        collapsed={isSidebarCollapsed}
        isMobileOpen={isNavigationOpen}
        onCloseMobile={() => setNavigationOpen(false)}
        onLogout={logout}
        onToggle={toggleSidebar}
        user={user}
      />
      <div className="min-w-0 flex-1">
        <AppHeader onLogout={logout} onOpenNavigation={() => setNavigationOpen(true)} user={user} />
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
