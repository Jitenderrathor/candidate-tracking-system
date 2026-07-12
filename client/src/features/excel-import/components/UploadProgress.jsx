import { Loader } from '@/components/common';

export function UploadProgress({ progress }) {
  return (
    <div aria-live="polite" className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <Loader
          label={progress >= 100 ? 'Processing workbook...' : 'Uploading workbook...'}
          size="sm"
        />
        <span className="text-sm font-semibold text-brand-700">{progress}%</span>
      </div>
      <div
        aria-label="Upload progress"
        aria-valuemax="100"
        aria-valuemin="0"
        aria-valuenow={progress}
        className="h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
