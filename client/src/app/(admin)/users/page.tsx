'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Trash2, X } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  is_verified: number;
  student_id: string | null;
}

type UserForm = {
  username: string;
  password: string;
  name: string;
  email: string;
  role: 'admin' | 'librarian' | 'member';
  studentId: string;
  indexNumber: string;
};

const emptyForm: UserForm = {
  username: '',
  password: '',
  name: '',
  email: '',
  role: 'member',
  studentId: '',
  indexNumber: ''
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery<{ data: User[]; totalCount: number }>({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/users')).data,
  });

  const users = data?.data ?? [];

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const saveUser = useMutation({
    mutationFn: async () => {
      const payload: any = {
        username: form.username,
        password: form.password,
        name: form.name,
        email: form.email,
        role: form.role,
      };
      if (form.role === 'member') {
        payload.studentId = form.studentId;
        payload.indexNumber = form.indexNumber;
      }
      await api.post('/users', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeForm();
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user account.'
      );
    },
  });

  const openAdd = () => {
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormError('');
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">Accounts</h1>
          <p className="opacity-60 mt-1">Manage system users, administrators, and members.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 py-2.5 pl-9 pr-3 outline-none font-mono text-sm bg-transparent"
              style={{ borderColor: 'var(--color-signal-border-dark)' }}
            />
          </div>
          <Button onClick={openAdd}>
            <Plus size={16} /> Create Account
          </Button>
        </div>
      </div>

      <Card surface="dark" className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="text-xs uppercase tracking-wider opacity-60 border-b" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
              <th className="p-4 font-mono font-normal">Name & Username</th>
              <th className="p-4 font-mono font-normal">Email</th>
              <th className="p-4 font-mono font-normal">Role</th>
              <th className="p-4 font-mono font-normal text-center">Status</th>
              <th className="p-4 font-mono font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center opacity-60">Loading users...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center opacity-60">No users found.</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
                  <td className="p-4">
                    <p className="font-bold truncate">{user.name}</p>
                    <p className="text-sm opacity-60 truncate">@{user.username}</p>
                  </td>
                  <td className="p-4 text-sm opacity-70">{user.email}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 border text-xs font-mono uppercase tracking-widest opacity-80" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {user.is_verified === 1 ? (
                      <span className="text-xs font-mono" style={{ color: 'var(--color-signal-available)' }}>VERIFIED</span>
                    ) : (
                      <span className="text-xs font-mono" style={{ color: 'var(--color-signal-pending)' }}>UNVERIFIED</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          if (confirm(`Delete user "${user.username}"?`)) deleteUser.mutate(user.id);
                        }}
                        className="p-2 opacity-70 hover:opacity-100"
                        style={{ color: 'var(--color-signal-overdue)' }}
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeForm}
        >
          <div
            className="signal-surface-dark w-full max-w-md border-2 p-6 max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'var(--color-signal-border-dark)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-mono font-bold text-lg">Create Account</h2>
              <button onClick={closeForm} aria-label="Close" className="opacity-60 hover:opacity-100">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFormError('');
                saveUser.mutate();
              }}
              className="space-y-4"
            >
              {formError && (
                <div className="text-sm font-mono px-3 py-2 border" style={{ borderColor: 'var(--color-signal-overdue)', color: 'var(--color-signal-overdue)' }}>
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-1.5">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                  className="w-full bg-transparent border-2 px-3 py-2 outline-none font-mono text-sm"
                  style={{ borderColor: 'var(--color-signal-border-dark)' }}
                >
                  <option value="member" className="bg-neutral-900 text-white">Member</option>
                  <option value="librarian" className="bg-neutral-900 text-white">Librarian</option>
                  <option value="admin" className="bg-neutral-900 text-white">Admin</option>
                </select>
              </div>

              {[
                { key: 'name', label: 'Full Name', type: 'text' },
                { key: 'username', label: 'Username', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'password', label: 'Temporary Password', type: 'password' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof UserForm]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full bg-transparent border-2 px-3 py-2 outline-none font-mono text-sm"
                    style={{ borderColor: 'var(--color-signal-border-dark)' }}
                    required
                  />
                </div>
              ))}

              {form.role === 'member' && (
                <>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-1.5">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={form.studentId}
                      onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                      className="w-full bg-transparent border-2 px-3 py-2 outline-none font-mono text-sm"
                      style={{ borderColor: 'var(--color-signal-border-dark)' }}
                      required={form.role === 'member'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-1.5">
                      Index Number
                    </label>
                    <input
                      type="text"
                      value={form.indexNumber}
                      onChange={(e) => setForm({ ...form, indexNumber: e.target.value })}
                      className="w-full bg-transparent border-2 px-3 py-2 outline-none font-mono text-sm"
                      style={{ borderColor: 'var(--color-signal-border-dark)' }}
                      required={form.role === 'member'}
                    />
                  </div>
                </>
              )}

              <Button type="submit" isLoading={saveUser.isPending} className="w-full mt-2">
                Create Account
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
