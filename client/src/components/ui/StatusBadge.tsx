import { CheckCircle2, Clock, BookMarked, AlertTriangle, type LucideIcon } from 'lucide-react';

export type BookStatus = 'available' | 'checked_out' | 'reserved' | 'overdue';

const STATUS_CONFIG: Record<BookStatus, { label: string; icon: LucideIcon; colorVar: string }> = {
  available: { label: 'Available', icon: CheckCircle2, colorVar: '--color-signal-available' },
  checked_out: { label: 'Checked Out', icon: Clock, colorVar: '--color-signal-pending' },
  reserved: { label: 'Reserved', icon: BookMarked, colorVar: '--color-signal-reserved' },
  overdue: { label: 'Overdue', icon: AlertTriangle, colorVar: '--color-signal-overdue' },
};

// Status is communicated via icon shape + accent border together, never
// color alone (colorblind accessibility). The accent color is only used as
// a border/icon fill (WCAG graphical-object contrast, 3:1) - never as the
// label's text color, since #00C98A specifically fails 4.5:1 text contrast
// on the light surface. The label text always uses the surrounding surface's
// own foreground color, which is already guaranteed AA-compliant.
export default function StatusBadge({ status }: { status: BookStatus }) {
  const { label, icon: Icon, colorVar } = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 border-2 font-mono text-xs uppercase tracking-wider whitespace-nowrap"
      style={{ borderColor: `var(${colorVar})` }}
    >
      <Icon size={13} strokeWidth={2.5} style={{ color: `var(${colorVar})` }} />
      {label}
    </span>
  );
}
