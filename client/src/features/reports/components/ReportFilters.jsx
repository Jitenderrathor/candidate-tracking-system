import { useState } from 'react';
import { Button, Card, Input, SearchBox, Select } from '@/components/common';
import {
  GENDER_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
} from '@/features/candidates/candidate.constants';
import { INITIAL_REPORT_FILTERS } from '@/features/reports/report.constants';

export function ReportFilters({ filters, onApply }) {
  const [draft, setDraft] = useState(filters);
  const update = (field) => (event) =>
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  const reset = () => {
    setDraft(INITIAL_REPORT_FILTERS);
    onApply(INITIAL_REPORT_FILTERS);
  };
  return (
    <Card className="space-y-5">
      <div>
        <h2 className="font-semibold text-slate-950">Report Filters</h2>
        <p className="mt-1 text-sm text-slate-500">
          Combine filters to analyze a specific recruitment segment.
        </p>
      </div>
      <SearchBox
        className="max-w-none"
        onChange={update('search')}
        onClear={() => setDraft((current) => ({ ...current, search: '' }))}
        placeholder="Search candidate name, ID, email, or mobile"
        value={draft.search}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Select
          label="Status"
          onChange={update('status')}
          options={STATUS_OPTIONS}
          value={draft.status}
        />
        <Select
          label="Source"
          onChange={update('source')}
          options={SOURCE_OPTIONS}
          value={draft.source}
        />
        <Select
          label="Gender"
          onChange={update('gender')}
          options={GENDER_OPTIONS}
          value={draft.gender}
        />
        <Input
          label="Qualification"
          onChange={update('qualification')}
          value={draft.qualification}
        />
        <Input
          label="Minimum Experience"
          min="0"
          onChange={update('minExperience')}
          type="number"
          value={draft.minExperience}
        />
        <Input
          label="Maximum Experience"
          min="0"
          onChange={update('maxExperience')}
          type="number"
          value={draft.maxExperience}
        />
        <Input
          label="Minimum Current CTC"
          min="0"
          onChange={update('minCurrentCTC')}
          type="number"
          value={draft.minCurrentCTC}
        />
        <Input
          label="Maximum Current CTC"
          min="0"
          onChange={update('maxCurrentCTC')}
          type="number"
          value={draft.maxCurrentCTC}
        />
        <Input
          label="Minimum Expected CTC"
          min="0"
          onChange={update('minExpectedCTC')}
          type="number"
          value={draft.minExpectedCTC}
        />
        <Input
          label="Maximum Expected CTC"
          min="0"
          onChange={update('maxExpectedCTC')}
          type="number"
          value={draft.maxExpectedCTC}
        />
        <Input
          label="Registration From"
          onChange={update('dateFrom')}
          type="date"
          value={draft.dateFrom}
        />
        <Input
          label="Registration To"
          onChange={update('dateTo')}
          type="date"
          value={draft.dateTo}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={reset} variant="ghost">
          Reset
        </Button>
        <Button onClick={() => onApply(draft)}>Apply Filters</Button>
      </div>
    </Card>
  );
}
