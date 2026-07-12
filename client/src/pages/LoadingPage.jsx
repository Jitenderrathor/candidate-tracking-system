import { Loader } from '@/components/common/Loader';

export function LoadingPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface">
      <Loader label="Loading application" size="lg" />
    </main>
  );
}
