import { LoaderCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-9' };

export function Loader({ className, label = 'Loading', size = 'md' }) {
  return (
    <span
      className={cn('inline-flex items-center gap-3 text-sm text-slate-500', className)}
      role="status"
    >
      <LoaderCircle aria-hidden="true" className={cn('animate-spin text-brand-600', sizes[size])} />
      <span>{label}</span>
    </span>
  );
}
