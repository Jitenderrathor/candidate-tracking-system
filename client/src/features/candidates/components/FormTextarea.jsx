import { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';

export const FormTextarea = forwardRef(function FormTextarea(
  { className, error, id, label, required, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const descriptionId = error ? `${textareaId}-description` : undefined;
  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={textareaId}>
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      <textarea
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className={cn(
          'min-h-24 w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400',
          error && 'border-red-500 focus-visible:ring-red-500',
          className,
        )}
        id={textareaId}
        ref={ref}
        required={required}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-600" id={descriptionId}>
          {error}
        </p>
      )}
    </div>
  );
});
