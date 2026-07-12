import { Card } from '@/components/common';

export function AuthCard({ children, description, title }) {
  return (
    <Card className="p-6 sm:p-8">
      <header className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Candidate Tracking System
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        {description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}
      </header>
      {children}
    </Card>
  );
}
