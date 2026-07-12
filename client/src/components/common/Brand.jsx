import { UserRoundSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

export function Brand({ compact = false, to = ROUTES.HOME }) {
  return (
    <Link className="inline-flex items-center gap-3 font-semibold text-slate-950" to={to}>
      <span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
        <UserRoundSearch aria-hidden="true" className="size-5" />
      </span>
      <span className={cn('leading-tight', compact && 'sr-only')}>
        <span className="block">CRTS</span>
        <span className="block text-xs font-normal text-slate-500">Candidate Tracking</span>
      </span>
    </Link>
  );
}
