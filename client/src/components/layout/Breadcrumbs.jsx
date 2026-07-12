import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { formatRouteSegment } from '@/utils/dashboardNavigation';

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-1 text-xs text-slate-500 sm:text-sm">
        <li>
          <Link
            aria-label="Dashboard"
            className="rounded-md p-1 hover:text-brand-700"
            to={ROUTES.DASHBOARD}
          >
            <Home aria-hidden="true" className="size-3.5" />
          </Link>
        </li>
        {segments.map((segment, index) => {
          const path = `/${segments.slice(0, index + 1).join('/')}`;
          const current = index === segments.length - 1;
          return (
            <li className="flex min-w-0 items-center gap-1" key={path}>
              <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-slate-300" />
              {current ? (
                <span aria-current="page" className="truncate font-medium text-slate-700">
                  {formatRouteSegment(segment)}
                </span>
              ) : (
                <Link className="truncate hover:text-brand-700" to={path}>
                  {formatRouteSegment(segment)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
