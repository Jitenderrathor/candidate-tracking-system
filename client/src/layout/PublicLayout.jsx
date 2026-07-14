import { Link, Outlet } from 'react-router-dom';
import { Brand } from '@/components/common/Brand';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';

export function PublicLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brand />
          <Button asChild variant="outline" size="sm">
            {isAuthenticated ? (
              <Link to={ROUTES.DASHBOARD}>Go to Dashboard</Link>
            ) : (
              <Link to={ROUTES.LOGIN}>Login</Link>
            )}
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-slate-500">
        Candidate Registration &amp; Tracking System
      </footer>
    </div>
  );
}
