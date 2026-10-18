# KVB Veterinary Inspection Portal

A digital inspection management system for the Kenya Veterinary Board (KVB), streamlining the
veterinary inputs outlet inspection process from field inspection through to final approval,
audit trail, and owner notification.

## Overview

The Kenya Veterinary Board Veterinary Inspection Portal digitizes the manual KVB inspection
questionnaire for veterinary inputs outlets (agrovets, chemists). The system enforces a
multi-level approval workflow with role-based access control, audit logging, email
notifications, and PDF report generation.

**Tagline:** *Upholding Veterinary Standards*

## Stack

- **Frontend:** React 19 + Vite + React Router 7, vanilla CSS with KVB design tokens
- **Backend:** Node.js + Express 5
- **Database:** MongoDB Atlas / Mongoose
- **Auth:** bcrypt + JWT in HTTP-only cookies
- **Email:** Nodemailer + SMTP
- **PDF:** pdfmake
- **Deployment:** Vercel (frontend) + Render (backend)

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- MongoDB Atlas account (or local MongoDB)
- SMTP credentials (Gmail or compatible)

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

**Backend** - create `backend/.env`:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/kvb_inspection?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-smtp-app-password
```

**Frontend** - create `frontend/.env`:

```env
VITE_API_BASE=http://localhost:5000/api
```

### 3. Seed the database (development only)

```bash
cd backend
npm run seed
```

### 4. Run development servers

```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

Then visit `http://localhost:5173`.

### Default demo users

| Role | Username | Password |
|------|----------|----------|
| Inspector | `inspector1` | `Password123` |
| Director | `director1` | `Password123` |
| CEO/Registrar | `ceoregistrar1` | `Password123` |
| System Admin | `admin1` | `Admin@123` |

## Production Build

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build  # (if applicable) or npm start
```

## Deployment

### Frontend (Vercel)

1. Push `frontend/` to GitHub
2. Import the project in Vercel
3. Set `VITE_API_BASE` to your backend API URL
4. Deploy

### Backend (Render)

1. Push `backend/` to GitHub
2. Create a new Web Service on Render
3. Set environment variables (see `.env.example`)
4. Set start command: `node server.js` (or `npm start`)

### MongoDB Atlas

1. Create a cluster on MongoDB Atlas
2. Create a database user with read/write access
3. Whitelist your IP (or use `0.0.0.0/0` for development)
4. Get the connection string and set it as `MONGODB_URI`

## Workflow

```
Inspector creates inspection (DRAFT)
  → Save drafts at any time
  → Submit inspection
    → SUBMITTED → PENDING_DIRECTOR_REVIEW
      → Director Review
        → Approve → DIRECTOR_APPROVED → PENDING_CEO_REVIEW
          → CEO/Registrar Final Review
            → Final Approve → FINAL_APPROVED (LOCKED)
              → PDF generated → Email sent to outlet owner
        → Return → RETURNED_TO_INSPECTOR → Inspector corrects → Resubmit
      → Return → RETURNED_TO_INSPECTOR → Inspector corrects → Resubmit
```

## KVB Branding

The interface uses the official KVB color palette:
- Green: `#0f6b3e` (primary)
- Dark Green: `#0b4d32` (header/accents)
- Gold: `#c9a44c` (brand mark)
- Navy: `#102a43` (text/headings)

Footer contact information:
- P.O. Box 513 - 00605, Uthiru
- Tel: +254-722 305 253 | +254-701 581 718
- info@kenyavetboard.or.ke

## Security

- bcrypt password hashing (12 rounds in production)
- JWT tokens in HTTP-only, Secure, SameSite cookies
- Role-based access control enforced on every backend route
- Helmet security headers (CSP, HSTS, X-Frame-Options)
- CORS restricted to configured frontend domain
- Rate limiting on authentication endpoints
- Input validation with express-validator on all endpoints
- Final-approved inspections are locked (immutable)
- Production error messages are generic (no stack traces)
- Environment variables for all secrets (`.env` excluded from Git)

## Testing

```bash
cd backend
npm test
```

Tests cover:
- Password hashing (bcrypt)
- JWT token signing/verification
- Workflow state transitions (all valid and invalid)
- Role-based authorization (Inspector/Director/CEO cannot cross-approve)
- Error handler (no stack traces in production)
