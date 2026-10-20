# User Acceptance Testing (UAT) Guide — KVB Inspection Portal

## 1. Prerequisites
- Backend running on port 5000, frontend on port 5173.
- MongoDB Atlas/local connected. Run `npm run seed` in `backend/` for base data (optional).
- Browser (Chrome recommended) with dev tools open.

## 2. Create Test Accounts

Register or seed three accounts with distinct roles:

| Role | Username | Email | Password |
|------|----------|-------|----------|
| Inspector | uat_inspector | inspector@uat.kvb | Password123 |
| Director | uat_director | director@uat.kvb | Password123 |
| CEO | uat_ceo | ceo@uat.kvb | Password123 |

Steps:
1. Sign in as SYSTEM_ADMIN.
2. Go to Users → Create User. Set username, email, password, and role per table.
3. Sign out.

## 3. End-to-End Workflow Test

### Step A — Inspector creates inspection
1. Sign in as `uat_inspector`.
2. Dashboard → New Inspection. Select an outlet (or create one).
3. Complete all 8 wizard steps (Inspection Info → Outlet → Owner → Attendants → Products → Findings → Sign-off → Review).
4. Click "Submit Inspection". Status should become SUBMITTED.

### Step B — Director reviews
1. Sign out; sign in as `uat_director`.
2. Open the submitted inspection. Review Comments tab → add a comment.
3. Approve or Return to Inspector. Verify status transitions.

### Step C — CEO final approval
1. Sign out; sign in as `uat_ceo`.
2. Open inspection; verify Final Approve locks record (edit returns 409).
3. Generate Reports → all three formats (PDF, Word, Excel) download automatically.

### Step D — Navigation & UX checks
1. Landing page → click an external link → use browser Back → returns to portal.
2. Stage 8 (Review) text is legible (no blur) in Form, Review Comments, Audit Trail tabs.

## 4. Pass Criteria
- All role flows complete without errors.
- Report downloads succeed without re-auth.
- Audit trail records field-level diffs.
- Locked record cannot be edited.
