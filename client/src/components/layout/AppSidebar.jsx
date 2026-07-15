import { ChevronLeft, ChevronRight, LogOut, Settings, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Brand } from '@/components/common/Brand';
import { DASHBOARD_NAVIGATION } from '@/constants/navigation';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/utils/permissions';

export function AppSidebar({ collapsed, isMobileOpen, onCloseMobile, onLogout, onToggle, user }) {
  const links = DASHBOARD_NAVIGATION.filter(
    (item) => !item.permissions || hasPermission(user, item.permissions),
  );
  const itemClasses =
    'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors';

  return (
    <>
      <button
        aria-label="Close navigation"
        className={cn(
          'fixed inset-0 z-30 bg-slate-950/45 opacity-0 backdrop-blur-sm transition-opacity lg:hidden',
          isMobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none',
        )}
        onClick={onCloseMobile}
        type="button"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r bg-white shadow-xl transition-[width,transform] duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none',
          isMobileOpen && 'translate-x-0',
          collapsed && 'lg:w-20',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Brand compact={collapsed} to="/dashboard" />
          <button
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={onCloseMobile}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav aria-label="Primary navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
          {links.map(({ icon: Icon, label, path }) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  itemClasses,
                  'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                  isActive && 'bg-brand-50 text-brand-700',
                  collapsed && 'lg:justify-center lg:px-0',
                )
              }
              key={path}
              onClick={onCloseMobile}
              title={collapsed ? label : undefined}
              to={path}
            >
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              <span className={cn(collapsed && 'lg:sr-only')}>{label}</span>
            </NavLink>
          ))}

        </nav>
        <div className="border-t p-3">
          <button
            className={cn(
              itemClasses,
              'text-slate-600 hover:bg-red-50 hover:text-red-700',
              collapsed && 'lg:justify-center lg:px-0',
            )}
            onClick={onLogout}
            title={collapsed ? 'Logout' : undefined}
            type="button"
          >
            <LogOut className="size-5 shrink-0" />
            <span className={cn(collapsed && 'lg:sr-only')}>Logout</span>
          </button>
        </div>
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-20 hidden size-7 items-center justify-center rounded-full border bg-white text-slate-500 shadow-sm hover:text-brand-700 lg:flex"
          onClick={onToggle}
          type="button"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </aside>
    </>
  );
}
