-- Indexes for hot query paths: active-loan lookups by member, overdue/status
-- scans in cron jobs, and login/lookup-by-email.
CREATE INDEX "borrowings_member_id_idx" ON "borrowings"("member_id");

CREATE INDEX "borrowings_status_idx" ON "borrowings"("status");

CREATE INDEX "users_email_idx" ON "users"("email");
