import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export const Select = forwardRef(function Select(
  {
    className,
    error,
    id,
    label,
    options = [],
    placeholder = 'Select an option',
    required,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const descriptionId = error ? `${selectId}-description` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={selectId}>
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          aria-describedby={descriptionId}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-9 text-sm shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100',
            error && 'border-red-500 focus-visible:ring-red-500',
            className,
          )}
          id={selectId}
          ref={ref}
          required={required}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option disabled={option.disabled} key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600" id={descriptionId}>
          {error}
        </p>
      )}
    </div>
  );
});
