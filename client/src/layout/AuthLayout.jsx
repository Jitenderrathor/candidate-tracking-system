import { Outlet } from 'react-router-dom';
import { Brand } from '@/components/common/Brand';

export function AuthLayout() {
  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.8fr)]">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Brand />
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-300">CRTS</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight">
            A dependable foundation for recruitment operations.
          </h1>
        </div>
        <p className="text-sm text-slate-400">Secure candidate registration and tracking.</p>
      </section>
      <section className="flex min-h-screen items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Brand />
          </div>
          <Outlet />
        </div>
      </section>
    </main>
  );
}
