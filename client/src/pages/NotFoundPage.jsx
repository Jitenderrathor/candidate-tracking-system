import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/constants/routes';

export function NotFoundPage() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-6 py-20 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">404</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950">Page not found</h1>
        <p className="mt-3 text-slate-500">The requested page does not exist or has moved.</p>
        <Button asChild className="mt-8">
          <Link to={ROUTES.HOME}>
            <ArrowLeft className="size-4" />
            Return home
          </Link>
        </Button>
      </div>
    </main>
  );
}
