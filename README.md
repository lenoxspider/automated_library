# SmartLib - Modernized Library Management System

SmartLib is a modernized, robust, and scalable library management system backend. Originally a monolithic Node.js application, it has been completely refactored into a clean, modular TypeScript MVC architecture using modern tooling and best practices.

## Ã°Å¸Å¡â‚¬ Technologies Used

- **Runtime & Language**: Node.js, TypeScript (Backend & Frontend)
- **Backend Framework**: Express.js
- **Frontend Framework**: Next.js 16 (App Router)
- **Frontend Styling**: Tailwind CSS, Framer Motion (Glassmorphism design)
- **State Management & Data Fetching**: Zustand, TanStack React Query
- **Database & ORM**: SQLite, Prisma ORM
- **Dependency Injection**: `tsyringe`
- **Validation**: Zod
- **Authentication**: JWT (JSON Web Tokens) with secure HTTP-only cookies
- **Background Jobs & Queues**: BullMQ & Redis (for sending emails)
- **Task Scheduling**: `node-cron` (for processing overdue fines daily)
- **API Documentation**: Swagger UI / OpenAPI 3.0
- **Testing**: Jest, Supertest
- **CI/CD**: GitHub Actions, Docker

## Ã°Å¸â€œÂ Project Structure

```
librarySys/
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ client/                   # Next.js 16 Frontend Application
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ src/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ app/              # Next.js App Router & Routes (Auth, Member, Admin, Librarian)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ components/       # Reusable React components (Auth, Navigation, UI)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ lib/              # API clients and utilities (Axios, React Query)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ store/            # Zustand global state (authStore)
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ Dockerfile            # Production multi-stage Docker build for frontend
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ prisma/
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ schema.prisma         # Prisma database schema
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ src/                      # Express.js Backend Application
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ config/               # Configuration (Prisma, Swagger, env, etc.)
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ controllers/          # Route handlers (Auth, Books, Borrowings, Settings, etc.)
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ middlewares/          # Express middlewares (Auth, Error handling)
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ repositories/         # Database access layer
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ routes/               # Express route definitions
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ services/             # Core business logic (Circulation, Cron, Email, Auth)
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ utils/                # Helper functions (CSV Parser, etc.)
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ __tests__/            # Jest unit and integration tests
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ app.ts                # Express app setup and middleware registration
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ server.ts             # Application entry point
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ plan/                     # Legacy scripts and migration planning documents
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ .env.example              # Example environment configuration
```

## Ã¢Å“Â¨ Key Features

- **Robust Authentication**: Secure registration with `student_roster` ID verification, dynamic JWT tokens, and secure HTTP-only cookie flows. Frontend guarded by Role-Based Access Control (RBAC).
- **Premium User Interface**: A state-of-the-art Next.js frontend utilizing glassmorphism, responsive tailwind styling, and Framer Motion micro-animations.
- **Inventory Management**: Tracks individual `book_copies` via unique crypto-secure barcodes. Backend checkout validations and a frontend Admin CRUD dashboard.
- **Circulation & Fines Engine**: Automatically calculates fines based on dynamically configurable `fine_rate` settings. Members can pay fines via the frontend Fines view.
- **Reservations**: Members can place holds on books directly from the Catalog view, while Librarians approve them in the Reservations Queue.
- **Dynamic Settings**: Administrators can update system limits (e.g., `max_loans`, `fine_rate`, `block_fines`) on the fly via dedicated API endpoints and a beautiful Settings UI.
- **Analytics & Reporting**: Generates circulation logs, blocked member reports, and roster audits viewable in the Admin Control Center.
- **Differential Privacy Analytics**: Publishes aggregate usage statistics (like popular books and peak search times) while protecting individual patron privacy by injecting mathematical noise via the Laplace mechanism.
- **Automated Cron Jobs**: Background service runs daily at midnight to scan active loans and automatically upsert fine records for overdue books.

## Ã°Å¸â€ºÂ Ã¯Â¸Â Setup Instructions

### 1. Prerequisites
Ensure you have the following installed on your machine:
- Node.js (v18+)
- Redis (Running on `localhost:6379`)

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Environment Configuration
Copy the `.env.example` file to `.env` and configure your local settings:
```bash
cp .env.example .env
```
Ensure that `DATABASE_FILE=library.db` is set correctly.

### 4. Database Setup
Generate the Prisma client and apply migrations:
```bash
npx prisma generate
npx prisma migrate deploy

If an existing development database was created before Prisma migrations were enabled, first back it up and verify it matches `prisma/schema.prisma`; then baseline the existing migration history with `npx prisma migrate resolve --applied <migration_name>`. Do not use `migrate reset` on a database containing required data.
```

(For local development, `npx prisma migrate dev` will additionally create a new
migration if you've changed `prisma/schema.prisma`.)

### 5. Running the Backend Application

**Development Mode**:
```bash
npm run dev
```

**Production Build**:
```bash
npm run build
npm start
```

### 6. Running the Frontend Application

The Next.js frontend is located in the `/client` directory and runs independently of the backend.

```bash
cd client
npm install
npm run dev
```
The frontend will be available at `http://localhost:3000`.

**Docker Production Build (Frontend)**:
```bash
cd client
docker build -t smartlib-frontend .
docker run -p 3000:3000 smartlib-frontend
```

## Ã°Å¸Â§Âª Testing

The project uses Jest and Supertest for unit and integration testing.

```bash
- Run the backend lint check with `npm run lint` before testing.

# Run the complete test suite
npm test
```

## Ã°Å¸â€œÅ¡ API Documentation

Once the server is running, you can interact with the API and view the full documentation via the Swagger UI interface:

**URL**: `http://localhost:3000/api-docs`

---
*Built as part of a system architecture modernization phase.*
