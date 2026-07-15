import { ChevronDown, KeyRound, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

export function ProfileMenu({ onLogout, user }) {
  const [isOpen, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const closeMenu = (event) => {
      if (event.key === 'Escape' || !menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', closeMenu);
    document.addEventListener('pointerdown', closeMenu);
    return () => {
      document.removeEventListener('keydown', closeMenu);
      document.removeEventListener('pointerdown', closeMenu);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-100"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="grid size-9 place-items-center rounded-lg bg-brand-100 text-sm font-semibold text-brand-700">
          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
        </span>
        <span className="hidden min-w-0 md:block">
          <span className="block truncate text-sm font-medium text-slate-900">{user?.name || 'Account'}</span>
          <span className="block text-xs text-slate-500 capitalize">{user?.role}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'hidden size-4 text-slate-400 transition-transform md:block',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-xl border bg-white p-2 shadow-xl"
          role="menu"
        >
          <div className="border-b px-3 py-2.5 md:hidden">
            <p className="truncate text-sm font-medium text-slate-900">{user?.name || 'Account'}</p>
            <span className="mt-1 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 capitalize">
              {user?.role}
            </span>
          </div>

          {user?.role !== 'User' && (
            <Link
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              onClick={() => setOpen(false)}
              role="menuitem"
              to={ROUTES.CHANGE_PASSWORD}
            >
              <KeyRound className="size-4" /> Change Password
            </Link>
          )}
          <button
            className="mt-1 flex w-full items-center gap-3 border-t px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            onClick={onLogout}
            role="menuitem"
            type="button"
          >
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
