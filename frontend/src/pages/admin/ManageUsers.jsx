import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { DataTable } from '../../components/ui/DataTable';
import { TableSkeleton } from '../../components/ui/Skeleton';

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const toast = useToast();
  const confirm = useConfirm();

  useDocumentTitle('Manage users');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (u) => {
    const ok = await confirm({
      title: 'Delete user account',
      description: `Delete ${u.firstName} ${u.lastName} (${u.email})? Their bookings will also be deleted and the seats of their confirmed bookings will be released.`,
      confirmText: 'Delete user',
      variant: 'danger'
    });

    if (!ok) return;

    try {
      await api.delete(`/api/users/${u._id}`);
      toast.success(`${u.firstName} ${u.lastName} was deleted.`);
      setUsers((prev) => prev.filter((item) => item._id !== u._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const columns = [
    {
      header: 'Name',
      cell: (u) => {
        const isSelf = currentUser && u._id === currentUser._id;
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">
              {u.firstName} {u.lastName}
            </span>
            {isSelf && (
              <span className="text-xs text-ink-muted">(you)</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: (u) => <span className="text-ink-muted">{u.email}</span>
    },
    {
      header: 'Role',
      cell: (u) => (
        <Badge variant={u.role === 'admin' ? 'accent' : 'neutral'}>
          {u.role}
        </Badge>
      )
    },
    {
      header: 'Phone',
      cell: (u) => <span className="text-ink-muted">{u.phone || '—'}</span>
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (u) => {
        const isSelf = currentUser && u._id === currentUser._id;
        if (isSelf) return null;
        return (
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(u)}
          >
            Delete
          </Button>
        );
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <ButtonLink to="/admin" variant="ghost" size="sm" className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Admin dashboard
        </ButtonLink>
        <PageHeader
          title="User management"
          description="View all registered accounts and remove users when needed."
        />
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Card className="p-6">
          <TableSkeleton rows={6} cols={5} />
        </Card>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No user accounts registered yet."
        />
      ) : (
        <Card className="overflow-hidden">
          <DataTable
            columns={columns}
            data={users}
            keyField="_id"
            mobileCard={(u) => {
              const isSelf = currentUser && u._id === currentUser._id;
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-ink">
                      <span>{u.firstName} {u.lastName}</span>
                      {isSelf && <span className="text-xs text-ink-muted">(you)</span>}
                    </div>
                    <Badge variant={u.role === 'admin' ? 'accent' : 'neutral'}>
                      {u.role}
                    </Badge>
                  </div>
                  <div className="text-xs text-ink-muted">{u.email}</div>
                  <div className="text-xs text-ink-muted">Phone: {u.phone || '—'}</div>
                  {!isSelf && (
                    <div className="pt-2 border-t border-line flex justify-end">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(u)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              );
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default ManageUsers;
