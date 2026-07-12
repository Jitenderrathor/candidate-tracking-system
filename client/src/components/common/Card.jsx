import { cn } from '@/utils/cn';

export function Card({ children, className }) {
  return (
    <div className={cn('rounded-xl border bg-white p-5 shadow-card', className)}>{children}</div>
  );
}
