import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileUp, RefreshCw, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Card, Loader, Modal } from '@/components/common';
import { importCandidateWorkbook } from '@/features/excel-import/excelImport.api';
import { ExcelDropzone } from '@/features/excel-import/components/ExcelDropzone';
import { ImportResults } from '@/features/excel-import/components/ImportResults';
import { UploadProgress } from '@/features/excel-import/components/UploadProgress';
import { downloadExcelTemplate } from '@/features/excel-import/excelTemplate';

export function ExcelImportPage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [progress, setProgress] = useState(0);
  const [isDownloading, setDownloading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const mutation = useMutation({
    mutationFn: (selectedFile) =>
      importCandidateWorkbook({ file: selectedFile, onProgress: setProgress }),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['candidates'] }),
        queryClient.invalidateQueries({ queryKey: ['internal-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['public-dashboard'] }),
      ]);
      toast.success(response.message);
    },
  });

  const upload = () => {
    if (!file) {
      setFileError('Select an .xlsx or .csv spreadsheet before uploading.');
      return;
    }
    setProgress(0);
    mutation.mutate(file);
  };
  const startAnother = () => {
    mutation.reset();
    setFile(null);
    setFileError('');
    setProgress(0);
  };
  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      await downloadExcelTemplate();
      toast.success('Sample template downloaded');
    } catch {
      toast.error('Unable to generate the Excel template');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Excel Import</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Bulk import up to 10,000 candidate records from an Excel or CSV spreadsheet.
          </p>
        </div>
        <Button disabled={isDownloading} onClick={downloadTemplate} variant="outline">
          {isDownloading ? (
            <Loader label="Generating..." size="sm" />
          ) : (
            <>
              <Download className="size-4" /> Download Sample Excel Template
            </>
          )}
        </Button>
      </header>

      {!mutation.isSuccess && (
        <Card className="space-y-6">
          <div>
            <h2 className="font-semibold text-slate-950">Upload Candidate Spreadsheet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use the sample template or common candidate header names.
            </p>
          </div>
          <ExcelDropzone
            disabled={mutation.isPending}
            error={fileError}
            file={file}
            onError={setFileError}
            onFileChange={setFile}
          />
          {mutation.isPending && <UploadProgress progress={progress} />}
          {mutation.isError && (
            <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-red-800">Import failed</p>
                <p className="mt-1 text-sm text-red-700">{mutation.error.message}</p>
              </div>
              <Button disabled={!file} onClick={upload} variant="outline">
                <RefreshCw className="size-4" /> Retry
              </Button>
            </div>
          )}
          <div className="flex justify-end">
            <Button
              disabled={!file || mutation.isPending}
              onClick={() => setShowConfirmation(true)}
            >
              {mutation.isPending ? (
                <Loader className="text-white" label="Importing..." size="sm" />
              ) : (
                <>
                  <FileUp className="size-4" /> Upload and Import
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {mutation.isSuccess && (
        <>
          <Card className="border-emerald-200 bg-emerald-50">
            <h2 className="font-semibold text-emerald-900">Import completed</h2>
            <p className="mt-1 text-sm text-emerald-700">
              The spreadsheet was processed successfully. Review the results below.
            </p>
          </Card>
          <ImportResults result={mutation.data.data} />
          <div className="flex justify-end">
            <Button onClick={startAnother} variant="outline">
              <RotateCcw className="size-4" /> Upload Another File
            </Button>
          </div>
        </>
      )}

      <Card>
        <h2 className="font-semibold text-slate-950">Before You Upload</h2>
        <ul className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <li>• `.xlsx` and `.csv` files are accepted.</li>
          <li>• Maximum file size is 20 MB.</li>
          <li>• Maximum 10,000 candidate rows.</li>
          <li>• Keep all 13 profile column headers unchanged.</li>
          <li>• Recruitment status is read from the `#REF!` column.</li>
          <li>• Duplicate emails or phone numbers are skipped.</li>
        </ul>
      </Card>
      <Modal
        description="The spreadsheet will be validated and all eligible candidate rows will be imported."
        footer={
          <>
            <Button onClick={() => setShowConfirmation(false)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirmation(false);
                upload();
              }}
            >
              <FileUp className="size-4" /> Start Import
            </Button>
          </>
        }
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Confirm Excel import"
      >
        <p className="break-all text-sm text-slate-600">
          Selected file: <strong>{file?.name}</strong>
        </p>
      </Modal>
    </div>
  );
}
