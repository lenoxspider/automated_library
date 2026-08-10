**Implementation Plan – SmartLib Frontend (Approval Required)**  

---

### 1️⃣ Role‑Based UI Mapping  

| Role | Primary Views | Navigation Flow | Key Interactions |
|------|----------------|-----------------|------------------|
| **Member** | • Catalog (search, filter, pagination) <br>• Book Detail (preview, hold button) <br>• My Loans (list, deadline countdown) <br>• Fines (list, pay‑button) <br>• Reservations (active holds) | Sidebar → **Catalog** → Book Detail → **Reserve** → **My Loans** → **Fines** | • Add/Remove holds <br>• View loan due dates (real‑time countdown) <br>• Initiate fine payment (redirect to payment modal) |
| **Librarian** | • Circulation Desk (barcode scanner input, checkout/return wizard) <br>• Reservations Queue (approve/decline) <br>• Fine Management (list, mark paid) | Top‑bar → **Circulation** → Scan → Confirm → **Reservations** → **Fines** | • Scan barcode → auto‑fetch copy status <br>• Process checkout/return with validation <br>• Issue/record fine payments |
| **Admin** | • Inventory Dashboard (books list, CRUD modals) <br>• Copy Management (add/remove barcodes) <br>• Settings Center (policy editor) <br>• Reporting Suite (circulation logs, blocked users, roster audit) | Left‑sidebar → **Inventory** → Book CRUD → **Copies** → **Settings** → **Reports** | • Bulk import/export CSV <br>• Real‑time policy validation (max loans, fine rate) <br>• Export reports (PDF/CSV) |

**Navigation Components**  
- **Responsive Sidebar** (collapsed on mobile, expanded on desktop) showing only routes permitted for the logged‑in role (driven by `useRBAC` hook).  
- **Top Bar** with user avatar, role badge, and global search.  
- **Breadcrumbs** for deep admin pages (e.g., *Settings → Fine Rate*).  

---

### 2️⃣ API Integration Strategy  

- **Auth Flow**  
  - `/api/auth/login` → returns **accessToken** (15 min) and **refreshToken** (30 d) in HttpOnly cookies.  
  - `/api/auth/register` → includes roster verification, email verification token sent via BullMQ.  
  - **Token Refresh** endpoint `/api/auth/refresh` called automatically when a 401 is intercepted.  
  - Logout clears cookies via `/api/auth/logout`.  

- **HTTP Client Layer**  
  - Create `src/lib/api.ts` exporting a pre‑configured **Axios** instance.  
  - Request interceptor injects `Authorization: Bearer <accessToken>` from cookie (via `js-cookie`).  
  - Response interceptor handles 401 → triggers token refresh → retries original request.  

- **Data Fetching & Caching**  
  - Use **React‑Query (TanStack Query)** as the data‑fetching layer.  
  - Each API call wrapped in a query/mutation hook (`useBooks`, `useLoan`, `useSettings`).  
  - Global **QueryClient** with default stale time = 60 s, refetch on window focus disabled for admin dashboards (to avoid unnecessary traffic).  
  - Loading skeletons (Shimmer UI) for all list views; error boundaries display friendly messages.  

- **Swagger Integration**  
  - Generate TypeScript types via `swagger-typescript-api` from `http://localhost:3000/api-docs`.  
  - Store generated types under `src/api/generated/` – keep them in version control and re‑run on API version bump.  

---

### 3️⃣ Technology Stack & Premium Design  

| Layer | Choice | Rationale |
|------|--------|-----------|
| **Framework** | **Next.js 14 (App Router)** in `/client` | Server‑side rendering for SEO on catalog pages, built‑in route groups for role‑based layouts, easy API route proxying if needed. |
| **Language** | TypeScript (strict mode) | Compile‑time safety for Prisma‑generated types and API contracts. |
| **Styling** | **Tailwind 4** + **CSS Variables** for theming | Rapid utility‑first styling, effortless dark‑mode toggle, and custom glass‑morphism utilities. |
| **Component Library** | **Mantine** (or **Radix UI** for primitives) – customized with Tailwind | Accessible base components (modals, tables, forms) that can be themed to match premium design. |
| **State Management** | **Zustand** for global UI state (theme, sidebar collapse, auth user) + **React‑Query** for server state | Minimal boilerplate, excellent devtools. |
| **Typography & Icons** | **Inter** (Google Font) for body, **Space Grotesk** for headings; **Radix Icons** + **Heroicons** for UI symbols. |
| **Color Palette** | - **Primary**: Deep Indigo `#3C3489` <br> - **Secondary**: Teal `#0F766E` <br> - **Accent**: Amber `#F59E0B` <br> - **Background**: Dark `#1E1E1C` + Glass overlay `rgba(255,255,255,0.08)` <br> - **Error**: Coral `#D9534F` | Palette chosen for contrast, readability, and a “luxury” feel. |
| **Glassmorphism** | Tailwind plugin defining `glass` utility: `backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl` <br> Apply to cards, modals, sidebars. |
| **Micro‑Animations** | **Framer Motion** for: <br> - Page transitions (fade/slide) <br> - Button hover lifts <br> - Loading skeleton shimmer <br> - Barcode scanner UI (camera‑like focus). |
| **Testing** | Jest + React Testing Library (unit) <br> Playwright (E2E) – CI runs on every PR. |
| **CI/CD** | GitHub Actions: lint → type‑check → unit tests → build → Docker image → Vercel/Netlify preview. |
| **Accessibility** | Auto‑generated ARIA via Mantine, manual audit with axe‑core, WCAG 2.1 AA compliance. |

---

### 4️⃣ Component Architecture (Top‑Down)  

```
src/
├─ app/                     # Next.js App Router
│   ├─ layout.tsx           # Root layout (ThemeProvider, AuthProvider, Sidebar)
│   ├─ (auth)/
│   │   ├─ login/page.tsx
│   │   └─ register/page.tsx
│   ├─ (member)/
│   │   ├─ catalog/
│   │   │   ├─ page.tsx
│   │   │   └─ BookCard.tsx
│   │   ├─ loans/
│   │   └─ fines/
│   ├─ (librarian)/
│   │   ├─ circulation/
│   │   │   ├─ page.tsx
│   │   │   └─ ScannerInput.tsx
│   │   └─ reservations/
│   └─ (admin)/
│       ├─ inventory/
│       │   ├─ page.tsx
│       │   ├─ BookForm.tsx
│       │   └─ CopyManager.tsx
│       ├─ settings/
│       └─ reports/
├─ components/
│   ├─ ui/                  # GlassCard, GlassButton, LoadingSkeleton, ModalWrapper
│   ├─ navigation/          # Sidebar, TopBar, Breadcrumbs
│   ├─ auth/                # ProtectedRoute, useRBAC hook
│   └─ forms/               # Generic Formik/Yup wrapper for Mantine fields
├─ lib/
│   ├─ api.ts               # Axios instance + interceptors
│   └─ queryClient.ts       # React‑Query client
├─ hooks/
│   └─ useAuth.ts
├─ store/
│   └─ uiStore.ts           # Zustand store (theme, sidebar state)
└─ styles/
    └─ globals.css          # Tailwind + CSS variables for glass theme
```

- **Route Groups** (`(member)`, `(librarian)`, `(admin)`) automatically enforce role‑based layout via `ProtectedRoute` wrapper.
- **Shared UI primitives** (`GlassCard`, `GlassButton`) guarantee a unified premium look.
- **Feature modules** (e.g., `inventory`) contain their own sub‑components and use React‑Query hooks for data.

---

### 5️⃣ Phased Development Timeline  

| Phase | Deliverables | Acceptance Criteria |
|------|--------------|---------------------|
| **0 – Setup** | • Initialize `/client` with `npx create-next-app@latest` (TS, Tailwind). <br>• Add ESLint/Prettier, Husky, CI skeleton. | Project builds locally, lint passes. |
| **1 – Auth & Core Layout** | • AuthProvider, JWT storage in HttpOnly cookies. <br>• Root layout with theme toggle, responsive sidebar, RBAC guard. | Login works, role‑based menu renders correctly. |
| **2 – Member Experience** | • Catalog page (search, pagination). <br>• BookDetail modal with “Place Hold”. <br>• My Loans view with deadline countdown. <br>• Fines view + payment modal. | Member can browse, reserve, view loans, and pay fines. |
| **3 – Librarian Desk** | • Barcode scanner component (input → fetch copy). <br>• Checkout/Return wizard with validation against `library_settings`. <br>• Reservations queue UI. <br>• Fine payment flow. | Librarian can process checkouts/returns and manage reservations without errors. |
| **4 – Admin Control Center** | • Inventory CRUD (books + copies). <br>• Settings editor (max loans, fine rate, block policies). <br>• Reporting dashboard (circulation log, blocked users, roster audit) with export options. | Admin can fully manage inventory, policies, and export reports. |
| **5 – Polish & Accessibility** | • Glassmorphism theming, dark‑mode toggle. <br>• Micro‑animations via Framer Motion. <br>• WCAG audit, ARIA enhancements. | Visual design matches premium spec; all interactive elements are accessible. |
| **6 – Testing & Release** | • Unit + integration tests (≥80 % coverage). <br>• Playwright E2E flow for each role. <br>• Dockerfile & CI pipeline ready for Vercel/Netlify. | All tests pass; CI deploys preview on push. |

**Milestone Review** – After each phase, run a stakeholder demo and collect sign‑off before proceeding to the next stage.

---

### 6️⃣ Risk Mitigation  

- **Token Sync** – Ensure HttpOnly cookies are same‑site `strict` to prevent CSRF; use `axios` interceptor for silent refresh.  
- **Role Leakage** – Centralize RBAC checks in `ProtectedRoute`; double‑check server‑side route guards.  
- **Performance** – Lazy‑load admin heavy tables with virtual scrolling (e.g., `react-window`).  
- **Design Drift** – Keep design tokens (colors, spacing, typography) in a single `tailwind.config.ts` file; reference them everywhere.  

---

**Next Action** – Review this plan. If approved, we will scaffold the Next.js project, set up the shared UI kit, and start with Phase 1 (Auth & Core Layout). Let me know any adjustments or priorities you’d like to modify.