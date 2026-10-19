# KVB Inspection Portal — Agent Guide

## Project Overview

Kenya Veterinary Board Veterinary Inspection Portal — a digital inspection management system
for veterinary inputs outlet inspections. Built with **Next.js 15** (frontend) and Node.js/Express
(backend), using MongoDB Atlas + Mongoose.

## Structure

```
backend/
  app.js              Express app (CORS, helmet, rate limiting, compression)
  server.js           Entry point (starts server + connects to MongoDB)
  config/
    db.js             MongoDB connection (pooling enabled)
    regions.js        Kenya counties + sub-counties with validation helpers
    inspectionFormConfig.js  Finding sections/statuses, product groups, limits, submission policy
  middleware/
    auth.js           requireAuth + requireRole middleware
    errorHandler.js   Centralized error handling ({ success, message, errors[] })
  models/
    User.js, Outlet.js, Inspection.js, InspectionComment.js, AuditLog.js, EmailLog.js, Counter.js
    index.js          Model registry + enums
  services/
    auditLogService.js       Audit log creation + per-inspection audit queries
    emailService.js          Nodemailer + templates
    pdfService.js            pdfmake PDF mirroring the KVB form layout
    inspectionNumberService.js  Sequential number generation
    inspectionService.js     Form normalisation, validation, compliance summary, diffing
    workflowService.js       State machine validation
  validators/
    authValidators.js, inspectionValidators.js, outletValidators.js, userValidators.js
  controllers/
    authController.js, inspectionController.js, outletController.js, userController.js
  routes/
    authRoutes.js, inspectionRoutes.js, inspectionFormRoutes.js, regionRoutes.js, outletRoutes.js, userRoutes.js, emailLogRoutes.js
  seeds/
    seedDatabase.js   Development seed script (npm run seed)
  tests/
    runTests.js       Security and workflow tests (npm test)
    smokeTest.js      End-to-end workflow test on in-memory MongoDB (npm run test:integration)
    httpAccessTest.js HTTP-level authorization, ReDoS, and pagination tests (npm run test:access)

frontend/
  app/                Next.js 15 App Router (replaces src/pages)
    layout.jsx        Root layout + providers (QueryProvider, AuthProvider)
    page.tsx          LandingPage (TypeScript + Tailwind CSS v4)
    login/page.jsx    LoginPage
    dashboard/page.jsx DashboardPage
    inspections/
      page.jsx       Inspection list (server-side search, filters, pagination)
      new/page.jsx   Multi-step inspection wizard
      [id]/page.jsx  Inspection detail, edit, submit, comments, audit trail
  components/
    ProtectedRoute.jsx, StatusBadge.jsx, ProgressBar.jsx, KvbLogo.jsx, SignaturePad.jsx
    inspections/    Wizard step components, step indicator, form shell, field primitives
  context/
    AuthContext.jsx   Authentication context (React Query + Axios)
  providers/
    QueryProvider.jsx  TanStack React Query client provider
  hooks/
    useInspections.js       React Query hooks for inspections
    useInspectionForm.js    Wizard state (steps, field setters, hydrate from local draft)
    useInspectionFormSchema.js  Form schema + region lookups from the backend
    useInspectionActions.js Create/update/submit/delete mutations
  lib/
    api.ts                  Axios HTTP client with interceptors
    inspectionForm.js       Form defaults, limits, per-step client validation
    draftStorage.js         Local device draft persistence (signatures excluded)
  styles/
    globals.css       Tailwind v4 base + design tokens (@config)
    LandingPage.css   Landing page component styles
    InspectionForm.css  Inspection wizard, findings, sign-off, review, print styles
  public/
    assets/           Static images (KVB logo)
    sw.js             No-op service worker placeholder
  eslint.config.js    ESLint 9 flat config
  prettier.config.js  Prettier config + Tailwind plugin
  tsconfig.json       TypeScript config (strict mode)
  next.config.mjs     Next.js config
  .eslintrc.json      Legacy — superseded by eslint.config.js
  _legacy_src/        Archived Vite source (for migration reference)
```

## Development Commands

```bash
# Backend
cd backend
npm install
npm run dev          # nodemon
npm run seed         # Seed database with demo users
npm test             # Run unit/security/workflow tests
npm run test:integration  # End-to-end test on in-memory MongoDB
npm run test:access  # HTTP-level authorization and ReDoS tests
npm run test:all     # All three suites

# Frontend
cd frontend
npm install
npm run dev          # Next.js dev server (http://localhost:5173)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript type checking
npm run format       # Prettier formatting
```

## KVB Branding

- Colors: `#0f6b3e` (green), `#0b4d32` (dark green), `#c9a44c` (gold), `#102a43` (navy)
- Footer: P.O. Box 513 - 00605, Uthiru | +254-722 305 253 | info@kenyavetboard.or.ke
- Tagline: "Upholding Veterinary Standards"

## Key Decisions

- TypeScript for type safety (frontend only)
- Next.js 15 App Router with SSR + React Server Components
- Tailwind CSS v4 with KVB design tokens
- TanStack React Query for data fetching (caching, dedup, background revalidation)
- Zustand for lightweight client state
- Axios with interceptors for HTTP client
- JWT in HTTP-only cookies (no localStorage)
- Mongoose models (not Prisma)
- pdfmake for PDF generation (PdfPrinter + standard PDF fonts, buffer output)
- express-validator for input validation
- ESLint 9 flat config with React plugin
- Prettier with Tailwind CSS class sorting

## Environment & Deployment Safety

These guards are deliberate. Do not remove them without understanding the failure they prevent.

- `backend/config/db.js` never falls back to the in-memory MongoDB when `NODE_ENV=production`; it throws and
  `server.js` exits non-zero. Previously an unreachable Atlas cluster silently started a throwaway database seeded
  with known demo credentials (`admin@kvb.ke` / `Admin@123`), and all data was lost on restart.
- `mongodb-memory-server` is a devDependency and is `require`d lazily, so `npm ci --omit=dev` production installs boot.
- `backend/seeds/seedDatabase.js` calls `dropDatabase()` and refuses to run when `NODE_ENV=production`.
- `server.js` exits if `JWT_SECRET` is missing in production rather than signing tokens with an undefined secret.
- `GET /api/health` is a liveness probe only; it does not verify database connectivity.
- Every user-supplied string that reaches `new RegExp()` must go through `escapeRegExp` first, and every list endpoint
  must cap `limit` (200) and return `total` from `countDocuments`, not the length of the current page.
- Outlet records are reference data. `SYSTEM_ADMIN`, `DIRECTOR`, and `INSPECTOR` may create or update them; inspectors can also read.
- `backend/.env` holds real credentials. It is gitignored, but this workspace is **not** a git repository, so the
  Atlas credential currently on disk has been exposed in plain text. Rotate it and move it to a secret manager.

## Inspection Module Notes

- The KVB paper questionnaire is the source of truth for field structure. `backend/config/inspectionFormConfig.js`
  defines the finding sections, statuses, product groups, length limits, and the submission-required policy, and
  is served to the frontend through `GET /api/inspection-form/schema` so terminology can change without code edits.
- `Inspection.formData` is a typed Mongoose sub-document (outlet, owner, attendants array, products, findings,
  signOff). Findings are `{ status, remarks, assessedAt }` with `status` constrained to the configured enum.
- Attendants are stored as an array (`formData.attendants[]`), never as `attendant1`/`attendant2` fields.
- Telephone numbers are normalised to canonical Kenyan format (`+2547XXXXXXXX` / `+2541XXXXXXXX` / `+25420XXXXXXX`)
  by `inspectionService.normalizeKenyanPhone`; the same rules run on the client for immediate feedback.
- Free-text fields reject HTML/script payloads; unknown keys are stripped by `normalizeFormData` before persistence.
- Only `DRAFT` and `RETURNED_TO_INSPECTOR` are editable. `FINAL_APPROVED` records are locked and return `409` on edit.
- Client identifiers (`inspectionNumber`, `createdBy`, `updatedBy`, `status`, timestamps) are server-controlled and
  are never taken from request bodies.
- Every state-changing operation writes an `AuditLog` entry including a field-level diff, IP address, and user agent;
  read it back with `GET /api/inspections/:id/audit-log`.
- Unsubmitted answers are mirrored to `localStorage` per user so a dropped connection does not lose work. Signature
  images are deliberately excluded from that copy and the copy is cleared once the draft reaches the portal.
- The form is rendered as an 8-step wizard. Client-side validation exists for speed only — the same rules are
  re-applied in Express validators, the controller, and Mongoose.
