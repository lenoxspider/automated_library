# SmartLib - Refactoring Task List

This document tracks the progress of the modular MVC refactoring, based on the approved phases.

## Phase 1: Foundation & TypeScript Setup
- [x] Initialize TypeScript (`tsconfig.json`) and configure compilation.
- [x] Set up ESLint and Prettier for code consistency.
- [x] Scaffold the new `src/` directory structure (`config`, `routes`, `controllers`, `services`, `repositories`, `middlewares`, `utils`).
- [x] Set up a basic `src/server.ts` and `src/app.ts` to replace the monolithic server entry point.

## Phase 2: Database Layer (Prisma)
- [x] Install Prisma and initialize the schema.
- [x] Run `prisma db pull` to introspect the existing SQLite database.
- [x] Refine the schema (add proper relations and Enums).
- [x] Generate the Prisma Client and create the repository layer.

## Phase 3: Core API Restructuring (MVC)
- [x] Migrate Book management routes and controllers.
- [x] Migrate User and Borrowing routes and controllers.
- [x] Hook up controllers to the Prisma repository layer.
- [x] Implement data validation using Zod.

## Phase 4: Authentication & Security (Redis & JWT)
- [x] Install and configure Redis.
- [x] Implement the `jwtAuth` middleware for validating access tokens.
- [x] Refactor login/register endpoints to issue JWTs and store refresh tokens in Redis.
- [x] Add security hardening middlewares (Helmet, CORS, Rate Limiting).

## Phase 5: Background Jobs & Emails
- [x] Isolate Nodemailer setup into `email.service.ts` using Handlebars.
- [x] Set up BullMQ (backed by Redis) to queue email sending.
- [x] Move existing `node-cron` jobs for overdue processing into `cron.service.ts`.

## Phase 6: Frontend Modernization
- [x] Scaffold the new frontend application (React/Vite setup).
- [x] Implement axios interceptors for JWT authentication flow.
- [x] Rebuild dashboard, login, and reporting UI components.

## Phase 7: Testing, Docs & CI/CD
- [x] Write unit tests for services using Jest.
- [x] Implement Swagger/OpenAPI documentation.
- [x] Create a GitHub Actions workflow for CI/CD.
