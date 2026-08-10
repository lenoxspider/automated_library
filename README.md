# SmartLib - Modernized Library Management System

SmartLib is a modernized, robust, and scalable library management system backend. Originally a monolithic Node.js application, it has been completely refactored into a clean, modular TypeScript MVC architecture using modern tooling and best practices.

## 🚀 Technologies Used

- **Runtime & Language**: Node.js, TypeScript (Backend & Frontend)
- **Backend Framework**: Express.js
- **Frontend Framework**: Next.js 14 (App Router)
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

## 📁 Project Structure

```
librarySys/
├── client/                   # Next.js 14 Frontend Application
│   ├── src/
│   │   ├── app/              # Next.js App Router & Routes (Auth, Member, Admin, Librarian)
│   │   ├── components/       # Reusable React components (Auth, Navigation, UI)
│   │   ├── lib/              # API clients and utilities (Axios, React Query)
│   │   └── store/            # Zustand global state (authStore)
│   └── Dockerfile            # Production multi-stage Docker build for frontend
├── prisma/
│   └── schema.prisma         # Prisma database schema
├── src/                      # Express.js Backend Application
│   ├── config/               # Configuration (Prisma, Swagger, env, etc.)
│   ├── controllers/          # Route handlers (Auth, Books, Borrowings, Settings, etc.)
│   ├── middlewares/          # Express middlewares (Auth, Error handling)
│   ├── repositories/         # Database access layer
│   ├── routes/               # Express route definitions
│   ├── services/             # Core business logic (Circulation, Cron, Email, Auth)
│   ├── utils/                # Helper functions (CSV Parser, etc.)
│   ├── __tests__/            # Jest unit and integration tests
│   ├── app.ts                # Express app setup and middleware registration
│   └── server.ts             # Application entry point
├── plan/                     # Legacy scripts and migration planning documents
└── .env.example              # Example environment configuration
```

## ✨ Key Features

- **Robust Authentication**: Secure registration with `student_roster` ID verification, dynamic JWT tokens, and secure HTTP-only cookie flows. Frontend guarded by Role-Based Access Control (RBAC).
- **Premium User Interface**: A state-of-the-art Next.js frontend utilizing glassmorphism, responsive tailwind styling, and Framer Motion micro-animations.
- **Inventory Management**: Tracks individual `book_copies` via unique crypto-secure barcodes. Backend checkout validations and a frontend Admin CRUD dashboard.
- **Circulation & Fines Engine**: Automatically calculates fines based on dynamically configurable `fine_rate` settings. Members can pay fines via the frontend Fines view.
- **Reservations**: Members can place holds on books directly from the Catalog view, while Librarians approve them in the Reservations Queue.
- **Dynamic Settings**: Administrators can update system limits (e.g., `max_loans`, `fine_rate`, `block_fines`) on the fly via dedicated API endpoints and a beautiful Settings UI.
- **Analytics & Reporting**: Generates circulation logs, blocked member reports, and roster audits viewable in the Admin Control Center.
- **Automated Cron Jobs**: Background service runs daily at midnight to scan active loans and automatically upsert fine records for overdue books.

## 🛠️ Setup Instructions

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

## 🧪 Testing

The project uses Jest and Supertest for unit and integration testing.

```bash
# Run the complete test suite
npm test
```

## 📚 API Documentation

Once the server is running, you can interact with the API and view the full documentation via the Swagger UI interface:

**URL**: `http://localhost:3000/api-docs`

---
*Built as part of a system architecture modernization phase.*
