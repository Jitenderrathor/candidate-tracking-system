import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useId, useState } from 'react';
import { cn } from '@/utils/cn';

export const Input = forwardRef(function Input(
  { className, error, helpText, id, label, required, type, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const descriptionId = error || helpText ? `${inputId}-description` : undefined;
  const [showPassword, setShowPassword] = useState(false);
  
  const isPasswordInput = type === 'password';
  const inputType = isPasswordInput ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={inputId}>
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          aria-describedby={descriptionId}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100',
            isPasswordInput && 'pr-10',
            error && 'border-red-500 focus-visible:ring-red-500',
            className,
          )}
          id={inputId}
          ref={ref}
          required={required}
          type={inputType}
          {...props}
        />
        {isPasswordInput && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
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
