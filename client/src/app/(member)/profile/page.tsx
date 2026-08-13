'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle,
  CircleDollarSign,
  Globe,
  IdCard,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import Card from '../../../components/ui/Card';

type ProfileUser = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  student_id: string | null;
  index_number: string | null;
  account_status: string | null;
  language: string | null;
  email_notifications: boolean;
  library_points: number;
  memberSince: string | null;
};

type ProfileStats = {
  activeLoans: number;
  totalBooksBorrowed: number;
  currentFines: number;
  activeReservations: number;
};

type ProfileResponse = {
  user: ProfileUser;
  stats: ProfileStats;
};

const inputClassName =
  'w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 2
  })
    .format(amount)
    .replace('GHS', 'GH₵');
}

function formatDate(date: string | null) {
  if (!date) return 'Not recorded';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'LM'
  );
}

function getPointsTier(points: number) {
  if (points >= 500) return 'Platinum tier';
  if (points >= 250) return 'Gold tier';
  if (points >= 100) return 'Silver tier';
  return 'Bronze tier';
}

export default function ProfilePage() {
  const { user, login } = useAuthStore();
  const [success, setSuccess] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState('en');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [password, setPassword] = useState('');

  const profileQuery = useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/users/profile')).data,
    enabled: Boolean(user),
    staleTime: 60 * 1000
  });

  const profile = profileQuery.data?.user;
  const stats = profileQuery.data?.stats;
  const displayName = profile?.name || user?.name || 'Library member';
  const points = profile?.library_points ?? 0;
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  // Synchronize editable fields when the authenticated profile response arrives.
  useEffect(() => {
    if (!profile) return;
    setName(profile.name || '');
    setUsername(profile.username || '');
    setLanguage(profile.language || 'en');
    setEmailNotifications(profile.email_notifications);
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (data: Record<string, string | boolean | undefined>) =>
      (await api.put('/users/profile', data)).data,
    onSuccess: (data) => {
      if (user) login({ ...user, name: data.user.name });
      setPassword('');
      setSuccess('Profile settings saved successfully.');
      void profileQuery.refetch();
      window.setTimeout(() => setSuccess(''), 4000);
    }
  });

  const statCards = [
    {
      label: 'Active loans',
      value: stats ? String(stats.activeLoans) : '—',
      meta: stats?.activeReservations
        ? `${stats.activeReservations} active holds`
        : 'Currently borrowed',
      icon: BookOpen,
      tone: 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/15'
    },
    {
      label: 'Books borrowed',
      value: stats ? String(stats.totalBooksBorrowed) : '—',
      meta: 'All-time reading history',
      icon: Award,
      tone: 'text-violet-600 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/15'
    },
    {
      label: 'Library points',
      value: stats ? String(points) : '—',
      meta: getPointsTier(points),
      icon: ShieldCheck,
      tone: 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/15'
    },
    {
      label: 'Current fines',
      value: stats ? formatCurrency(stats.currentFines) : '—',
      meta: stats?.currentFines ? 'Payment required' : 'Account in good standing',
      icon: CircleDollarSign,
      tone: stats?.currentFines
        ? 'text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-500/15'
        : 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/15'
    }
  ];

  return (
    <div className="min-h-full space-y-6 pb-8">
      <Card className="overflow-hidden p-0">
        <div className="h-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500" />
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-indigo-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/20">
              {initials}
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
                Your library identity
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100 md:text-3xl">
                {displayName}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                @{profile?.username || 'member'} <span className="mx-1">•</span>{' '}
                {profile?.role || user?.role || 'member'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3 md:min-w-[410px]">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Student ID
              </p>
              <p className="mt-1 font-semibold text-gray-800 dark:text-slate-200">
                {profile?.student_id || 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Member since
              </p>
              <p className="mt-1 font-semibold text-gray-800 dark:text-slate-200">
                {formatDate(profile?.memberSince ?? null)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Account
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 font-semibold capitalize text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {profile?.account_status || 'active'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">{stat.meta}</p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}
                >
                  <Icon size={19} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {profileQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          We could not load the latest account statistics. Your saved profile settings are still
          available below.
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSuccess('');
          updateProfile.mutate({
            name,
            username,
            language,
            emailNotifications,
            password: password || undefined
          });
        }}
        className="grid grid-cols-1 gap-6 xl:grid-cols-3"
      >
        <Card className="p-6 xl:col-span-2">
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-gray-100 pb-4 dark:border-slate-700">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-slate-100">
                <UserRound size={19} className="text-indigo-600 dark:text-indigo-400" />
                Personal information
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Keep the details used to identify your library account up to date.
              </p>
            </div>
            <IdCard size={20} className="text-gray-300 dark:text-slate-600" />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="profile-name"
                className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300"
              >
                Full name
              </label>
              <input
                id="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label
                htmlFor="profile-username"
                className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300"
              >
                Username
              </label>
              <input
                id="profile-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label
                htmlFor="profile-email"
                className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                />
                <input
                  id="profile-email"
                  value={profile?.email || user?.email || ''}
                  disabled
                  className={`${inputClassName} cursor-not-allowed pl-9 opacity-70`}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">
                Email changes are managed by library staff.
              </p>
            </div>
            <div>
              <label
                htmlFor="profile-index"
                className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300"
              >
                Index number
              </label>
              <div className="relative">
                <IdCard
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                />
                <input
                  id="profile-index"
                  value={profile?.index_number || 'Not assigned'}
                  disabled
                  className={`${inputClassName} cursor-not-allowed pl-9 opacity-70`}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6 border-b border-gray-100 pb-4 dark:border-slate-700">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-slate-100">
              <Lock size={19} className="text-indigo-600 dark:text-indigo-400" />
              Security
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Update your password to keep your account protected.
            </p>
          </div>
          <label
            htmlFor="profile-password"
            className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300"
          >
            New password
          </label>
          <input
            id="profile-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Leave blank to keep current password"
            className={inputClassName}
            minLength={6}
          />
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-indigo-50 px-3 py-2.5 text-xs text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            Use at least six characters.
          </div>
        </Card>

        <Card className="p-6 xl:col-span-2">
          <div className="mb-6 border-b border-gray-100 pb-4 dark:border-slate-700">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-slate-100">
              <Globe size={19} className="text-indigo-600 dark:text-indigo-400" />
              Preferences
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Choose how SmartLib communicates with you.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 dark:border-slate-700">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(event) => setEmailNotifications(event.target.checked)}
                className="mt-1 h-4 w-4 accent-indigo-600"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-800 dark:text-slate-200">
                  Email notifications
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-slate-400">
                  Receive due-date reminders, reservation updates, and important account notices.
                </span>
              </span>
            </label>
            <div>
              <label
                htmlFor="profile-language"
                className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300"
              >
                Language
              </label>
              <select
                id="profile-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className={inputClassName}
              >
                <option value="en">English</option>
                <option value="tw">Twi</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="flex flex-col items-stretch justify-end gap-3 xl:col-span-3 sm:flex-row sm:items-center">
          {success && (
            <div className="mr-auto flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={17} />
              {success}
            </div>
          )}
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />
            {updateProfile.isPending ? 'Saving...' : 'Save profile settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
