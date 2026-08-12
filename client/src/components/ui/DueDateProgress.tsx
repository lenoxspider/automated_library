import { useEffect, useState } from 'react';

// Visual due-date progress bar for a loan: fills from borrow_date to
// due_date, color escalates as the due date approaches / passes.
export default function DueDateProgress({
  borrowDate,
  dueDate,
}: {
  borrowDate: string;
  dueDate: string;
}) {
  const start = new Date(borrowDate).getTime();
  const end = new Date(dueDate).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const total = Math.max(end - start, 1);
  const elapsed = Math.min(Math.max(now - start, 0), total);
  const pct = Math.round((elapsed / total) * 100);
  const isOverdue = now > end;

  const colorVar = isOverdue
    ? '--color-signal-overdue'
    : pct > 75
      ? '--color-signal-pending'
      : '--color-signal-available';

  return (
    <div className="w-full">
      <div className="h-1.5 w-full bg-black/10 overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: `var(${colorVar})` }}
        />
      </div>
    </div>
  );
}
