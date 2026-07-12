import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';

export function Modal({ children, className, description, footer, isOpen, onClose, title }) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div aria-labelledby={titleId} aria-modal="true" className="fixed inset-0 z-50" role="dialog">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            'max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl',
            className,
          )}
          ref={panelRef}
          tabIndex={-1}
        >
          <header className="flex items-start justify-between gap-4 border-b p-5">
            <div>
              <h2 className="font-semibold text-slate-950" id={titleId}>
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-slate-500" id={descriptionId}>
                  {description}
                </p>
              )}
            </div>
            <Button aria-label="Close modal" onClick={onClose} size="icon" variant="ghost">
              <X className="size-5" />
            </Button>
          </header>
          <div className="p-5">{children}</div>
          {footer && (
            <footer className="flex flex-wrap justify-end gap-3 border-t p-5">{footer}</footer>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
