-- Convert borrowings date columns and users.reset_token_expiry from TEXT
-- (ISO 8601 strings) to TIMESTAMP(3), so date filtering/comparisons are done
-- by Postgres natively instead of via fragile string comparison.
ALTER TABLE "borrowings"
  ALTER COLUMN "borrow_date" TYPE TIMESTAMP(3) USING "borrow_date"::timestamp(3),
  ALTER COLUMN "due_date" TYPE TIMESTAMP(3) USING "due_date"::timestamp(3),
  ALTER COLUMN "return_date" TYPE TIMESTAMP(3) USING "return_date"::timestamp(3);

ALTER TABLE "users"
  ALTER COLUMN "reset_token_expiry" TYPE TIMESTAMP(3) USING "reset_token_expiry"::timestamp(3);
