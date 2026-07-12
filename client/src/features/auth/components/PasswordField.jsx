import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/common';

export const PasswordField = forwardRef(function PasswordField({ label, ...props }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        className="pr-11"
        label={label}
        ref={ref}
        type={visible ? 'text' : 'password'}
        {...props}
      />
      <button
        aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
        className="absolute right-1 top-[1.85rem] flex size-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="size-4" />
        ) : (
          <Eye aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  );
});
