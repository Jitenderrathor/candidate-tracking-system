import { Bell, Menu, Search, UserRoundSearch } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProfileMenu } from '@/components/layout/ProfileMenu';
import { getPageTitle } from '@/utils/dashboardNavigation';

export function AppHeader({ onLogout, onOpenNavigation, user }) {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onOpenNavigation}
          type="button"
        >
          <Menu className="size-5" />
        </button>
        <span
          aria-label="Company logo"
          className="hidden size-9 place-items-center rounded-lg bg-brand-600 text-white sm:grid lg:hidden"
        >
          <UserRoundSearch className="size-4" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-slate-950 sm:text-lg">
            {getPageTitle(pathname)}
          </h1>
        </div>
        <div className="ml-auto hidden md:block"></div>
        <ProfileMenu onLogout={onLogout} user={user} />
      </div>
      <div className="border-t bg-white px-4 py-2 sm:px-6 lg:px-8">
        <Breadcrumbs />
      </div>
    </header>
  );
}
