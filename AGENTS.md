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
npm run test:live    # Verification against the real Atlas cluster
npm run test:live:local  # Same suite against a throwaway in-memory MongoDB
npm run test:all     # All three suites

# Frontend
cd frontend
npm install
npm run dev          # Next.js dev server (http://localhost:5173)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript type checking
npm test             # Unit tests (node:test, no test framework dependency)
npm run audit:icons  # Check every Font Awesome name against the FA6 free set
npm run test:ui      # Browser checks for the landing page and auth panels
npm run test:auth    # Sign-in / sign-out flow checks against a running stack
npm run crawl        # Load every route and report failed requests
npm run screenshots  # Capture landing, login and dark-mode screenshots
npm run format       # Prettier formatting
```

The browser checks under `frontend/scripts/` drive the system Chrome through
Playwright (`channel: 'chrome'`), so no browser download is needed. `npm run
test:ui` and `npm run test:auth` expect the app to be running on
`http://localhost:5173`; `test:auth` also needs the backend on port 5000 and
signs in as `ui_test_inspector` / `Password123`.

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

## Frontend Styling Conventions

- `frontend/app/globals.css` is loaded by the root layout, so it applies to every route. `frontend/styles/LandingPage.css`
  is imported by the landing page only and is bundled into **its own CSS chunk**, which the browser loads *after*
  `globals.css` and then keeps for the rest of the session — including after a client-side navigation to another
  route. An unscoped selector in `LandingPage.css` therefore overrides the same selector in `globals.css` on routes
  the landing page was never meant to style.
  - This caused the brand text on the sign-in panel to render navy instead of white after a sign-out, because
    `LandingPage.css` set `.kvb-logo-pill-text-main { color: var(--kvb-navy) }` for the hero.
  - The rule now lives on `.kvb-logo-pill--hero .kvb-logo-pill-text-main`, and `globals.css` pins the auth panel with
    `.kvb-left .kvb-logo-pill-text-main { color: #ffffff }`, which wins on specificity regardless of chunk order.
  - **When a class is used on more than one route, scope the rule to the route's own wrapper.**
- Font Awesome is loaded from the CDN as 6.5.1. `npm run audit:icons` checks every `fa-*` name in the source against
  the free set, because a name that is not in the set renders as an empty box.
- The `fa` base class sets `display: inline-block`. Any `<i class="fa ...">` that needs to be centred in a box must
  set `display: inline-flex` on a selector that outranks it, or the glyph spills out of its container.

## Landing Page

- The "Our Services" section follows the visual identity of the Board's management system,
  `https://mms.kenyavetboard.or.ke/#services`: a red-to-orange gradient icon tile, an uppercase category badge, an
  "Available online" status pill, a 22px card with a soft layered shadow, and a green gradient pill button. The tokens
  live on `.lp-shell` as `--pms-*` so the rest of the portal keeps its own palette.
- Services that the Board runs elsewhere hand over to the Board's own systems (`mms.kenyavetboard.or.ke` for
  registration and licensing, `kenyavetboard.or.ke/en/...` for education, downloads and enquiries). Only the
  inspection service links back into this portal. External links open in a new tab with `rel="noopener noreferrer"`.

## Session Handling

- The session probe `GET /auth/me` answers **401 for every signed-out visitor**. It is expected, not an error.
- The Axios response interceptor only redirects to `/login` on a 401 when the current route is **protected**. On a
  public route a 401 just means "not signed in"; redirecting there used to bounce every guest off the landing page
  before they could read it. `PUBLIC_ROUTES` in `frontend/lib/api.ts` lists the routes that must stay reachable.
- Every query that hits a protected endpoint waits for the session to resolve before it fires
  (`enabled: !authLoading && Boolean(user)` in `useInspections`, `useOutlets` and `useInspectionFormSchema`). Without
  that gate the protected pages fired their list requests before the auth check and collected a 401 each time.
- The brand text on the sign-in panel is pinned white by `.kvb-left .kvb-logo-pill-text-main` in `globals.css`. Keep
  it that way: the sign-out path lands on `/login` with the landing page's stylesheet still loaded, so an unscoped
  colour there repaints the text navy.

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
- `backend/.env` holds real credentials. It is gitignored, so the Atlas credential on disk is not in version control, but it
  has been readable in plain text in this workspace. Rotate it and move it to a secret manager.

## Live Database Verification

- `npm run test:live` runs `backend/tests/liveVerification.js` against the real Atlas cluster. It never falls back to the
  in-memory database — it exists to confirm the production data set matches the current models.
- The suite requires this machine's public IP to be in the Atlas **Network Access** list. When the connection is refused
  it prints the IP to whitelist and the Atlas console path. The IP is dynamic on this network, so a single allow-list
  entry will eventually need updating.
- It is read-mostly. The only writes are a probe outlet, probe user, and probe inspection that are deleted again
  afterwards, plus `createIndexes()` calls. `createIndexes()` is additive and safe; `syncIndexes()` is never used because
  it drops indexes the schema does not declare.
- Checks cover: collection presence, unique indexes (`users.email`, `users.username`, `inspections.inspectionNumber`),
  search indexes, the sequential inspection-number counter, absence of legacy `attendant1`/`attendant2` fields, finding
  statuses still matching `inspectionFormConfig`, telephone numbers in canonical form, a GPS coordinate round-trip, and
  the absence of seeded demo accounts.
- `npm run test:live:local` runs the same suite against a throwaway `mongodb-memory-server` instance. Use it to prove
  the suite's own logic before pointing it at production.

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
