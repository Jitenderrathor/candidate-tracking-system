import { Outlet } from 'react-router-dom';
import { Brand } from '@/components/common/Brand';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Brand />
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-slate-500">
        Candidate Registration &amp; Tracking System
      </footer>
    </div>
  );
}
