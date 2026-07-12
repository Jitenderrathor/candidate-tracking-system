import { useState } from 'react';
import { Button, Select } from '@/components/common';

const roleOptions = [
  { label: 'Admin', value: 'Admin' },
  { label: 'User', value: 'User' },
];
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];
const sortOptions = [
  { label: 'Newest first', value: '-createdAt' },
  { label: 'Oldest first', value: 'createdAt' },
  { label: 'Name A–Z', value: 'name' },
  { label: 'Name Z–A', value: '-name' },
];

export function UserFilters({ filters, onApply, onReset }) {
  const [draft, setDraft] = useState(filters);
  const change = (field) => (event) =>
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  return (
    <div className="grid gap-4 rounded-xl border bg-slate-50/70 p-4 sm:grid-cols-3">
      <Select label="Role" onChange={change('role')} options={roleOptions} value={draft.role} />
      <Select
        label="Status"
        onChange={change('status')}
        options={statusOptions}
        value={draft.status}
      />
      <Select label="Sort By" onChange={change('sort')} options={sortOptions} value={draft.sort} />
      <div className="flex justify-end gap-2 sm:col-span-3">
        <Button
          onClick={() => {
            const clean = { role: '', status: '', sort: '-createdAt' };
            setDraft(clean);
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
