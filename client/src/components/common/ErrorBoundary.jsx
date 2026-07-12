import { Component } from 'react';
import { Button } from '@/components/common/Button';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, information) {
    console.error('Unhandled UI error', error, information);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-surface p-6 text-center">
        <div className="max-w-md rounded-2xl border bg-white p-8 shadow-card">
          <h1 className="text-2xl font-semibold text-slate-950">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500">
            The application encountered an unexpected error. Reload to continue.
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Reload application
          </Button>
        </div>
      </main>
    );
  }
}
