import { Card, EmptyState } from '@/components/common';

export function ChartCard({ children, description, empty, title }) {
  return (
    <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
      <header className="mb-5">
        <h2 className="font-semibold text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </header>
      {empty ? (
        <EmptyState
          description="Analytics will appear when candidate data is available."
          title="No data yet"
        />
      ) : (
        children
      )}
    </Card>
  );
}
