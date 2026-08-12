'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Bell, Globe, Lock, Save, CheckCircle } from 'lucide-react';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import Card from '../../../components/ui/Card';

export default function ProfilePage() {
  const { user, login } = useAuthStore();
  const [success, setSuccess] = useState('');

  // form state
  const [name, setName] = useState(user?.name || '');
  const [language, setLanguage] = useState('en');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [password, setPassword] = useState('');

  const updateProfile = useMutation({
    mutationFn: async (data: unknown) => {
      return (await api.put('/users/profile', data)).data;
    },
    onSuccess: (res) => {
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);

      // Update local state if needed
      if (user) {
        login({ ...user, name: res.user.name });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, string | boolean> = { name, language, emailNotifications };
    if (password) payload.password = password;
    updateProfile.mutate(payload);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight text-gray-900 dark:text-slate-100">
          Profile & Preferences
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Manage your personal settings.</p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle size={18} />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card surface="light" className="p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">
            <User size={18} className="opacity-50" />
            <h2 className="font-semibold">Personal Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-2 px-3 py-2 outline-none focus:border-indigo-500 transition-colors bg-transparent"
                style={{ borderColor: 'var(--color-signal-border-light)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full border-2 px-3 py-2 outline-none bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 opacity-60 cursor-not-allowed rounded"
                style={{ borderColor: 'var(--color-signal-border-light)' }}
              />
              <p className="text-xs opacity-50 mt-1">Email cannot be changed.</p>
            </div>
          </div>
        </Card>

        <Card surface="light" className="p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">
            <Globe size={18} className="opacity-50" />
            <h2 className="font-semibold">Preferences</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">Display Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border-2 px-3 py-2 outline-none focus:border-indigo-500 transition-colors bg-transparent"
                style={{ borderColor: 'var(--color-signal-border-light)' }}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="notifications"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label
                htmlFor="notifications"
                className="text-sm font-medium flex items-center gap-2 cursor-pointer"
              >
                <Bell size={16} className="opacity-60" />
                Receive email notifications for due dates and holds
              </label>
            </div>
          </div>
        </Card>

        <Card surface="light" className="p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">
            <Lock size={18} className="opacity-50" />
            <h2 className="font-semibold">Security</h2>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full border-2 px-3 py-2 outline-none focus:border-indigo-500 transition-colors bg-transparent"
              style={{ borderColor: 'var(--color-signal-border-light)' }}
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
