import { FileSpreadsheet, Replace, Trash2, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/common';
import {
  CSV_MIME_TYPE,
  MAX_FILE_SIZE,
  XLSX_MIME_TYPE,
} from '@/features/excel-import/excelImport.constants';
import { cn } from '@/utils/cn';

const validateFile = (file) => {
  if (!file) return 'Select a spreadsheet to continue.';
  const extension = file.name.toLowerCase().split('.').pop();
  if (!['xlsx', 'csv'].includes(extension))
    return 'Only .xlsx and .csv spreadsheet files are supported.';
  if (file.type && extension === 'xlsx'
    && ![XLSX_MIME_TYPE, 'application/octet-stream'].includes(file.type))
    return 'This file does not appear to be a valid .xlsx workbook.';
  if (file.type && extension === 'csv'
    && ![CSV_MIME_TYPE, 'application/csv', 'application/vnd.ms-excel', 'text/plain'].includes(file.type))
    return 'This file does not appear to be a valid CSV file.';
  if (file.size > MAX_FILE_SIZE) return 'The spreadsheet exceeds the 20 MB upload limit.';
  return '';
};

export function ExcelDropzone({ disabled, error, file, onError, onFileChange }) {
  const inputRef = useRef(null);
  const [isDragging, setDragging] = useState(false);
  const selectFile = (selected) => {
    const message = validateFile(selected);
    onError(message);
    if (!message) onFileChange(selected);
  };
  const drop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) selectFile(event.dataTransfer.files[0]);
  };

  if (file)
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <FileSpreadsheet className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              size="sm"
              variant="outline"
            >
              <Replace className="size-4" /> Replace
            </Button>
            <Button
              disabled={disabled}
              onClick={() => {
                onFileChange(null);
                onError('');
              }}
              size="icon"
              variant="ghost"
            >
              <Trash2 className="size-4 text-red-600" />
            </Button>
          </div>
        </div>
        <input
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          className="sr-only"
          onChange={(event) => {
            selectFile(event.target.files[0]);
            event.target.value = '';
          }}
          ref={inputRef}
          type="file"
        />
      </div>
    );

  return (
    <div>
      <button
        className={cn(
          'flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50/70 p-8 text-center transition',
          isDragging
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-300 hover:border-brand-400 hover:bg-brand-50/40',
          disabled && 'cursor-not-allowed opacity-60',
        )}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={drop}
        type="button"
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-700">
          <UploadCloud className="size-7" />
        </span>
        <strong className="mt-4 text-base text-slate-900">Drop your spreadsheet here</strong>
        <span className="mt-2 text-sm text-slate-500">
          or click to browse · .xlsx or .csv · maximum 20 MB
        </span>
      </button>
      <input
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="sr-only"
        onChange={(event) => {
          selectFile(event.target.files[0]);
          event.target.value = '';
        }}
        ref={inputRef}
        type="file"
      />
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
