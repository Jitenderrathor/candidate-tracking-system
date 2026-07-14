import { useState } from 'react';
import { Button, Input, Select } from '@/components/common';
import {
  SORT_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
} from '@/features/candidates/candidate.constants';

export function CandidateFilters({ filters, onApply, onReset }) {
  const [draft, setDraft] = useState(filters);
  const update = (field) => (event) =>
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  return (
    <div className="grid gap-4 rounded-xl border bg-slate-50/70 p-4 sm:grid-cols-2 xl:grid-cols-4">
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
      <Select label="Sort By" onChange={update('sort')} options={SORT_OPTIONS} value={draft.sort} />
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
        label="Created From"
        onChange={update('createdFrom')}
        type="date"
        value={draft.createdFrom}
      />
      <Input
        label="Created To"
        onChange={update('createdTo')}
        type="date"
        value={draft.createdTo}
      />
      <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-4 xl:justify-end">
        <Button
          onClick={() => {
            setDraft({
              ...filters,
              status: '',
              source: '',
              minExperience: '',
              maxExperience: '',
              createdFrom: '',
              createdTo: '',
              sort: '-createdAt',
            });
            onReset();
          }}
          variant="ghost"
        >
          Reset
        </Button>
        <Button onClick={() => onApply(draft)}>Apply Filters</Button>
      </div>
    </div>
  );
}
