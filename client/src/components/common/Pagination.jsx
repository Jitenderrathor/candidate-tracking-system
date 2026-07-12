import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common/Button';

export function Pagination({ currentPage = 1, onPageChange, totalPages = 1 }) {
  const previousDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      <p className="text-sm text-slate-500">
        Page <span className="font-medium text-slate-900">{currentPage}</span> of{' '}
        <span className="font-medium text-slate-900">{Math.max(totalPages, 1)}</span>
      </p>
      <div className="flex gap-2">
        <Button
          aria-label="Previous page"
          disabled={previousDisabled}
          onClick={() => onPageChange(currentPage - 1)}
          size="icon"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          aria-label="Next page"
          disabled={nextDisabled}
          onClick={() => onPageChange(currentPage + 1)}
          size="icon"
          variant="outline"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
