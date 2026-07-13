import { EXCEL_HEADERS } from '@/features/excel-import/excelImport.constants';

export const downloadExcelTemplate = async () => {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Candidate Registration & Tracking System';
  const worksheet = workbook.addWorksheet('Candidates', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  worksheet.addRow(EXCEL_HEADERS);
  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  header.alignment = { vertical: 'middle' };
  header.height = 24;
  worksheet.columns = EXCEL_HEADERS.map((name) => ({
    key: name,
    width: Math.max(14, name.length + 3),
  }));
  worksheet.autoFilter = { from: 'A1', to: 'K1' };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'candidate-import-template.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
