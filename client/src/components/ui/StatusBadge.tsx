import { CheckCircle2, Clock, BookMarked, AlertTriangle, type LucideIcon } from 'lucide-react';

export type BookStatus = 'available' | 'checked_out' | 'reserved' | 'overdue';

const STATUS_CONFIG: Record<BookStatus, { label: string; icon: LucideIcon; classNames: string }> = {
  available: { label: 'Available', icon: CheckCircle2, classNames: 'bg-green-100 text-green-800 border-green-200' },
  checked_out: { label: 'Checked Out', icon: Clock, classNames: 'bg-amber-100 text-amber-800 border-amber-200' },
  reserved: { label: 'Reserved', icon: BookMarked, classNames: 'bg-blue-100 text-blue-800 border-blue-200' },
  overdue: { label: 'Overdue', icon: AlertTriangle, classNames: 'bg-red-100 text-red-800 border-red-200' },
};

export default function StatusBadge({ status }: { status: BookStatus }) {
  const { label, icon: Icon, classNames } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${classNames}`}
    >
      <Icon size={14} strokeWidth={2.5} />
      {label}
    </span>
  );
}
