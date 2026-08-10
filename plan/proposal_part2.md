**TL;DR** – Follow a staged migration: scaffold missing controllers, extract legacy logic into services, wire them via DI, add validation, and write unit/integration tests before deprecating the old monolith.

- **Stage 1 – Scaffold & Wire Controllers**
  - Create files: `src/controllers/auth.controller.ts`, `src/controllers/book.controller.ts`, `src/controllers/circulation.controller.ts`, `src/controllers/reservation.controller.ts`, `src/controllers/settings.controller.ts`, `src/controllers/report.controller.ts`.
  - Register routers in `src/routes/index.ts` (e.g., `app.use('/api/auth', authRouter)`).
  - Inject required services via **tsyringe** (e.g., `AuthService`, `UserService`, `EmailService`, `BookService`, `CirculationService`, `ReservationService`, `SettingService`, `ReportService`).

- **Stage 2 – Auth & Recovery**
  - **Register**:  
    - Validate payload with **Zod** (`email`, `password`, `studentId`, `indexNumber`).  
    - Use `UserService.verifyRoster(studentId, indexNumber)` → query `student_roster` via Prisma.  
    - On success, create user, generate email‑verification JWT, enqueue `EmailJob` (BullMQ).  
  - **Forgot Password**:  
    - Endpoint `/auth/forgot` → accept `email`.  
    - Generate reset token (crypto‑random, 1 h expiry) stored in `PasswordResetToken` table.  
    - Enqueue verification email.  
  - **Reset Password**:  
    - Endpoint `/auth/reset/:token` → verify token, hash new password with `bcrypt`, update user, delete token.  
  - **Email Verification**:  
    - Endpoint `/auth/verify/:token` → decode JWT, set `user.isVerified = true`.  

- **Stage 3 – Books & Copies**
  - **addBookCopy** (`POST /books/:id/copies`):  
    - Service checks book existence, generates `barcode` (`crypto.randomUUID()`), creates `BookCopy` record.  
  - **getBookCopies** (`GET /books/:id/copies`):  
    - Return paginated list of copies with status fields.  
  - **updateBook** (`PUT /books/:id`) & **deleteBook** (`DELETE /books/:id`):  
    - Use `BookService.update` / `delete`; cascade delete copies via Prisma `onDelete: Cascade`.  

- **Stage 4 – Circulation & Fines**
  - **Borrowing (checkout)** (`POST /circulation/checkout`):  
    - Load `library_settings` → verify `max_loans` and unpaid fine count for user.  
    - Verify copy is `available`.  
    - Create `Loan` record, set copy status to `checkedOut`.  
  - **Return** (`POST /circulation/return`):  
    - Locate active loan, set `returnedAt`, compute overdue days, create `Fine` if needed, set copy status back to `available`.  
  - **Fine Endpoints**:  
    - `GET /fines` – list user fines.  
    - `POST /fines/:id/pay` – mark fine as paid (optionally integrate payment gateway stub).  

- **Stage 5 – Reservations & Settings**
  - **ReservationsController**:  
    - `POST /reservations` – create hold if no available copy; set expiry (48 h).  
    - `DELETE /reservations/:id` – cancel pending reservation.  
    - Auto‑fulfill logic lives in `ReservationService.fulfillIfPossible` (triggered from `CirculationService.checkout` or a cron).  
  - **SettingsController** (admin‑only):  
    - `GET /settings` – fetch all key/value pairs.  
    - `PUT /settings/:key` – validate and persist new policy (e.g., `max_loans`, `fine_rate`).  

- **Stage 6 – Reporting & Analytics**
  - **Circulation Log** (`GET /reports/circulation`): query `Loan` with filters (date range, user, book).  
  - **Blocked Members** (`GET /reports/blocked`): users where `isBlocked = true` or `unpaidFines > threshold`.  
  - **Roster Audit** (`GET /reports/roster-audit`): compare `users.studentId` against `student_roster` to flag mismatches.  
  - Return CSV on `?format=csv` using `json2csv`.  

- **Stage 7 – Background Jobs**
  - Implement `processOverdueAccounts()` in `CronService`:
    ```ts
    async function processOverdueAccounts() {
      const overdueLoans = await prisma.loan.findMany({
        where: { dueDate: { lt: new Date() }, returnedAt: null },
        include: { copy: true, user: true },
      });
      for (const loan of overdueLoans) {
        const days = Math.ceil((Date.now() - loan.dueDate.getTime()) / 86400000);
        const amount = days * Number(process.env.FINE_RATE);
        await prisma.fine.create({
          data: { userId: loan.userId, loanId: loan.id, amount },
        });
        // optional: notify user via EmailService
      }
    }
    ```
  - Register the job: `cron.schedule('0 0 * * *', processOverdueAccounts);`.

- **Stage 8 – Validation, Testing & Deprecation**
  - Add **Zod** schemas for every request payload; plug into route middlewares.  
  - Write unit tests for each service method (`*.spec.ts`).  
  - Write integration tests with **Supertest** covering happy paths and policy‑rejection cases.  
  - Run the old monolith in parallel on a different port; use API contract tests to ensure parity before shutting it down.

- **Stage 9 – Documentation & CI**
  - Generate OpenAPI spec with **swagger-jsdoc** from controller JSDoc comments.  
  - Add GitHub Actions workflow: lint → type‑check → test → Prisma migration check → Docker build.  

**Gotchas**
- Ensure `student_roster` is indexed on `studentId` for fast verification.  
- When moving to Prisma, some SQLite `ALTER TABLE` operations need manual migration scripts (e.g., adding new columns).  
- JWT revocation for email verification can be handled by storing a `usedTokens` set in Redis to prevent replay.  

---  

**Next step** – pick a controller (e.g., Auth) and start implementing the registration endpoint with roster verification; once that pattern is solid, replicate across the remaining modules.  

[MEMORY:preference:5:User prefers concise, digestible explanations]