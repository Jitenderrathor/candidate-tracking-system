import { Children, cloneElement, forwardRef } from 'react';
import { cn } from '@/utils/cn';

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300',
  secondary: 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400',
  outline: 'border bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400',
  ghost: 'text-slate-700 hover:bg-slate-100 disabled:text-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  icon: 'size-10 p-0',
};

export const Button = forwardRef(function Button(
  {
    asChild = false,
    children,
    className,
    size = 'md',
    type = 'button',
    variant = 'primary',
    ...props
  },
  ref,
) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-70',
    variants[variant],
    sizes[size],
    className,
  );

  if (asChild) {
    const child = Children.only(children);
    return cloneElement(child, { ...props, className: cn(classes, child.props.className), ref });
  }

  return (
    <button className={classes} ref={ref} type={type} {...props}>
      {children}
    </button>
  );
});
