# SmartLib Frontend - Implementation Tasklist

## Phase 0 – Setup
- [x] Initialize `/client` with `npx create-next-app@latest` (TypeScript, Tailwind).
- [x] Add ESLint, Prettier, Husky, and CI skeleton.
- [x] Configure `globals.css` with premium aesthetic design tokens.
- [x] Setup Axios API utility (`src/lib/api.ts`).

## Phase 1 – Auth & Core Layout
- [x] Implement AuthProvider and JWT storage via HttpOnly cookies (or secure local storage).
- [x] Build the Root layout with theme toggle, responsive sidebar, and RBAC guard.
- [x] Implement Login and Registration views.

## Phase 2 – Member Experience
- [x] Build the Catalog page with search, pagination, and Shimmer UI.
- [x] Build the BookDetail modal with "Place Hold" functionality.
- [x] Build the My Loans view with deadline countdowns.
- [x] Build the Fines view and payment modal.

## Phase 3 – Librarian Desk
- [x] Build the Circulation Desk with barcode scanner UI.
- [x] Build the Checkout/Return wizard with policy validation.
- [x] Build the Reservations queue UI.
- [x] Build the Fine payment processing flow.

## Phase 4 – Admin Control Center
- [x] Build Inventory CRUD dashboards (books and copies).
- [x] Build the Settings editor (max loans, fine rate).
- [x] Build the Reporting dashboard (circulation log, blocked users, roster audit).

## Phase 5 – Polish & Accessibility
- [x] Implement Glassmorphism theming and dark-mode toggle.
- [x] Add Micro-animations via Framer Motion.
- [x] Perform WCAG audit and add ARIA enhancements.

## Phase 6 – Testing & Release
- [x] Write Unit and Integration tests (Jest + RTL).
- [x] Write Playwright E2E flows for each role.
- [x] Create Dockerfile and finalize CI pipeline.
