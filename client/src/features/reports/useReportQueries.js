import { keepPreviousData, useQueries } from '@tanstack/react-query';
import {
  getCandidateReport,
  getMonthlyReport,
  getPipelineReport,
  getReportSummary,
  getSourceReport,
  getStatusReport,
} from '@/features/reports/report.api';

export function useReportQueries(filters, page, sort) {
  const definitions = [
    ['summary', getReportSummary, filters],
    ['status', getStatusReport, filters],
    ['source', getSourceReport, filters],
    ['monthly', getMonthlyReport, filters],
    ['pipeline', getPipelineReport, filters],
    ['candidates', getCandidateReport, { ...filters, page, limit: 20, sort }],
  ];
  const results = useQueries({
    queries: definitions.map(([name, queryFn, params]) => ({
      queryKey: ['reports', name, params],
      queryFn: () => queryFn(params),
      placeholderData: keepPreviousData,
    })),
  });
  return {
    summary: results[0],
    status: results[1],
    source: results[2],
    monthly: results[3],
    pipeline: results[4],
    candidates: results[5],
    all: results,
  };
}
