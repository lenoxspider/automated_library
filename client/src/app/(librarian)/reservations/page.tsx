'use client';

import { AlertCircle, BookMarked } from 'lucide-react';
import Card from '../../../components/ui/Card';

// KNOWN BACKEND LIMITATION: there is no GET /reservations endpoint at all
// (only POST / to create and DELETE /:id to cancel exist in
// src/routes/reservations.ts) and no "approve" endpoint either. The
// previous version of this page called both of those as if they existed.
// Rebuilt to say so honestly rather than call endpoints that 404 - listing
// and approving reservations needs backend work outside this redesign's
// scope (only the Part 3 cover feature was authorized as a backend change).
export default function ReservationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">Reservations Queue</h1>
        <p className="opacity-60 mt-1">Manage pending book holds placed by members.</p>
      </div>

      <Card surface="dark" className="p-8 flex items-start gap-4">
        <AlertCircle className="shrink-0 mt-0.5" style={{ color: 'var(--color-signal-pending)' }} />
        <div>
          <p className="font-bold flex items-center gap-2">
            <BookMarked size={16} /> No endpoint to list reservations yet
          </p>
          <p className="opacity-70 text-sm mt-2 max-w-lg">
            The API only supports creating a reservation (<code className="font-mono">POST /reservations</code>)
            and cancelling one by ID (<code className="font-mono">DELETE /reservations/:id</code>). There is no
            <code className="font-mono"> GET /reservations</code> to list pending holds, and no approve
            endpoint - this queue can&apos;t be built as a working feature without a backend addition,
            which is outside this frontend-only redesign&apos;s scope.
          </p>
        </div>
      </Card>
    </div>
  );
}
