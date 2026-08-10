# SmartLib Part 2: Business Logic Migration

## Stage 1: Controllers & Dependency Injection Wiring
- [x] Scaffold `CirculationController`, `ReservationController`, `SettingsController`, `ReportController`.
- [x] Register new routers in `src/routes/index.ts` (or `app.ts`).
- [x] Inject required services (Auth, User, Email, Book, Circulation, Reservation, Setting, Report) via `tsyringe`.

## Stage 2: Auth & Recovery
- [x] Implement `register` endpoint with `student_roster` verification logic.
- [x] Implement `forgot-password` endpoint (generate crypto token, store in DB, enqueue email).
- [x] Implement `reset-password` endpoint.
- [x] Implement `/auth/verify/:token` endpoint to decode JWT and set `isVerified`.

## Stage 3: Books & Copies
- [x] Implement `addBookCopy` (`POST /books/:id/copies`) logic (generate barcode, increment availability).
- [x] Implement `getBookCopies` (`GET /books/:id/copies`).
- [x] Implement `updateBook` and `deleteBook` logic.

## Stage 4: Circulation & Fines
- [x] Implement Borrowing/checkout logic (verify `max_loans`, unpaid fines, and copy availability).
- [x] Implement Return logic (compute overdue days, create `Fine`, reset copy status).
- [x] Implement Fine management endpoints (`GET /fines`, `POST /fines/:id/pay`).

## Stage 5: Reservations & Settings
- [x] Implement `POST /reservations` (create hold, set 48h expiry).
- [x] Implement `DELETE /reservations/:id` (cancel hold).
- [x] Implement Settings endpoints (`GET /settings`, `PUT /settings/:key`) for admin policy changes.

## Stage 6: Reporting & Analytics
- [x] Implement Circulation Log query.
- [x] Implement Blocked Members query.
- [x] Implement Roster Audit query.
- [x] Implement CSV export formatting for reports.

## Stage 7: Background Jobs
- [x] Implement full `processOverdueAccounts()` logic in `CronService` (query overdue loans, calculate amounts, create fines).

## Stage 8: Validation, Testing & Deprecation
- [x] Enforce Zod validation on all new request payloads.
- [x] Write Jest unit tests for service methods.
- [x] Write Supertest integration tests for happy paths and policy rejection cases.

## Stage 9: Documentation & CI
- [x] Expand Swagger/OpenAPI docs for the new endpoints.
- [x] Ensure GitHub Actions CI passes.
