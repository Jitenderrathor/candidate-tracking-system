import { Search, X } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export const SearchBox = forwardRef(function SearchBox(
  { className, onChange, onClear, placeholder = 'Search…', value = '', ...props },
  ref,
) {
  return (
    <div className={cn('relative w-full max-w-md', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
      />
      <input
        aria-label="Search"
        className="h-10 w-full rounded-lg border bg-white pl-9 pr-9 text-sm shadow-sm placeholder:text-slate-400 [&::-webkit-search-cancel-button]:appearance-none"
        onChange={onChange}
        placeholder={placeholder}
        ref={ref}
        type="search"
        value={value}
        {...props}
      />
      {value && (
        <button
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          onClick={onClear}
          type="button"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
});
