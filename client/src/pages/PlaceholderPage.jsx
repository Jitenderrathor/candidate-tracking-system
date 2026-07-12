import { Construction } from 'lucide-react';

export function PlaceholderPage({ description, title }) {
  return (
    <section className="mx-auto flex min-h-[55vh] max-w-3xl items-center justify-center px-4 py-16">
      <div className="w-full rounded-2xl border border-dashed bg-white p-10 text-center shadow-card">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Construction aria-hidden="true" className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          {description || 'Route foundation is ready. Business UI will be implemented separately.'}
        </p>
      </div>
    </section>
  );
}
