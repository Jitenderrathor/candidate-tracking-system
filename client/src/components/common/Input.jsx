import { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';

export const Input = forwardRef(function Input(
  { className, error, helpText, id, label, required, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const descriptionId = error || helpText ? `${inputId}-description` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={inputId}>
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}
      <input
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className={cn(
          'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100',
          error && 'border-red-500 focus-visible:ring-red-500',
          className,
        )}
        id={inputId}
        ref={ref}
        required={required}
        {...props}
      />
      {(error || helpText) && (
        <p
          className={cn('mt-1.5 text-xs text-slate-500', error && 'text-red-600')}
          id={descriptionId}
        >
          {error || helpText}
        </p>
      )}
    </div>
  );
});
