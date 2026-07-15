import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Filter, KeyRound, Pencil, Plus, RefreshCw, UserCheck, UserX, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, Pagination, SearchBox, Table } from '@/components/common';
import { listUsers } from '@/features/users/user.api';
import { ResetPasswordModal } from '@/features/users/components/ResetPasswordModal';
import { UserFilters } from '@/features/users/components/UserFilters';
import { UserListSkeleton } from '@/features/users/components/UserListSkeleton';
import { UserStatusModal } from '@/features/users/components/UserStatusModal';
import { UserDeleteModal } from '@/features/users/components/UserDeleteModal';
import { useAuth } from '@/hooks/useAuth';
import { AddUserPage } from '@/pages/AddUserPage';
import { EditUserPage } from '@/pages/EditUserPage';
import { cn } from '@/utils/cn';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const filterDefaults = { role: '', status: '', sort: '-createdAt' };

function Badge({ children, tone }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        tone,
      )}
    >
      {children}
    </span>
  );
}

export function UserListPage() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [statusUser, setStatusUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const mode = searchParams.get('mode');
  const editId = searchParams.get('id');
  const filters = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(filterDefaults).map((key) => [
          key,
          searchParams.get(key) || filterDefaults[key],
        ]),
      ),
    [searchParams],
  );
  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';
  const apiParams = useMemo(
    () =>
      Object.fromEntries(
        Object.entries({ search, ...filters, page, limit: 20 }).filter(([, value]) => value !== ''),
      ),
    [filters, page, search],
  );
  const query = useQuery({
    queryKey: ['users', apiParams],
    queryFn: () => listUsers(apiParams),
    placeholderData: keepPreviousData,
    enabled: !mode,
  });

  const updateParams = (changes) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(changes).forEach(([key, value]) =>
        value ? next.set(key, value) : next.delete(key),
      );
      return next;
    });
  if (mode === 'add') return <AddUserPage />;
  if (mode === 'edit') return <EditUserPage userId={editId} />;

  const columns = [
    {
      key: 'fullName',
      header: 'Full Name',
      cellClassName: 'font-medium text-slate-950 min-w-40',
      render: (user) => user.fullName || user.name,
    },
    { key: 'email', header: 'Email', cellClassName: 'min-w-48' },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <Badge
          tone={
            user.role === 'Admin'
              ? 'bg-violet-50 text-violet-700 ring-violet-600/20'
              : 'bg-blue-50 text-blue-700 ring-blue-600/20'
          }
        >
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <Badge
          tone={
            user.isActive
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              : 'bg-slate-100 text-slate-600 ring-slate-500/20'
          }
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      cellClassName: 'whitespace-nowrap',
      render: (user) => dateFormatter.format(new Date(user.createdAt)),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => {
        const isSelf = String(user._id) === String(currentUser?.id);
        return (
          <div className="flex items-center gap-1">
            <Button
              aria-label={`Edit ${user.fullName}`}
              onClick={() => updateParams({ mode: 'edit', id: user._id })}
              size="icon"
              variant="ghost"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              aria-label={`${user.isActive ? 'Deactivate' : 'Activate'} ${user.fullName}`}
              disabled={isSelf && user.isActive}
              onClick={() => setStatusUser(user)}
              size="icon"
              title={isSelf && user.isActive ? 'You cannot deactivate your own account' : undefined}
              variant="ghost"
            >
              {user.isActive ? (
                <UserX className="size-4 text-amber-600" />
              ) : (
                <UserCheck className="size-4 text-emerald-600" />
              )}
            </Button>
            <Button
              aria-label={`Reset password for ${user.fullName}`}
              onClick={() => setResetUser(user)}
              size="icon"
              variant="ghost"
            >
              <KeyRound className="size-4" />
            </Button>
            <Button
              aria-label={`Delete ${user.fullName}`}
              disabled={isSelf}
              onClick={() => setDeleteModalUser(user)}
              size="icon"
              title={isSelf ? 'You cannot delete your own account' : undefined}
              variant="ghost"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage application accounts, roles, and access.
          </p>
        </div>
        <Button onClick={() => updateParams({ mode: 'add' })}>
          <Plus className="size-4" /> Add User
        </Button>
      </header>
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchBox
            className="max-w-none md:max-w-md"
            onChange={(event) => updateParams({ search: event.target.value, page: '' })}
            onClear={() => updateParams({ search: '', page: '' })}
            placeholder="Search name or email"
            value={search}
          />
          <Button onClick={() => setShowFilters((current) => !current)} variant="outline">
            <Filter className="size-4" /> Filters
          </Button>
          <Button disabled={query.isFetching} onClick={() => query.refetch()} variant="ghost">
            <RefreshCw className={query.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh
          </Button>
        </div>
        {showFilters && (
          <UserFilters
            filters={filters}
            onApply={(values) => updateParams({ ...values, page: '' })}
            onReset={() => {
              setSearchParams((current) => {
                const next = new URLSearchParams(current);
                next.delete('role');
                next.delete('status');
                next.delete('sort');
                return next;
              });
            }}
          />
        )}
      </Card>
      {query.isPending ? (
        <UserListSkeleton />
      ) : query.isError ? (
        <EmptyState
          action={<Button onClick={() => query.refetch()}>Try again</Button>}
          description={query.error.message}
          title="Unable to load users"
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={query.data.users}
            emptyMessage="No users match your search and filters."
            getRowKey={(user) => user._id}
          />
          <Pagination
            currentPage={query.data.meta.currentPage}
            onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
            totalPages={query.data.meta.totalPages}
          />
          <p className="text-sm text-slate-500">
            {query.data.meta.total} user{query.data.meta.total === 1 ? '' : 's'} found
          </p>
        </>
      )}
      {statusUser && (
        <UserStatusModal isOpen onClose={() => setStatusUser(null)} user={statusUser} />
      )}
      {resetUser && (
        <ResetPasswordModal isOpen onClose={() => setResetUser(null)} user={resetUser} />
      )}
      {deleteModalUser && (
        <UserDeleteModal isOpen onClose={() => setDeleteModalUser(null)} user={deleteModalUser} />
      )}
    </div>
  );
}
