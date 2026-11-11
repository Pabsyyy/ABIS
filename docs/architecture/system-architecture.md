# ABIS — System Architecture

Three-tier architecture (manuscript Figure 3), adapted to the approved stack.

```
[ Browser ]  Presentation tier — Next.js (App Router), TypeScript, Tailwind, shadcn-style UI
     |  HTTPS (prod) / credentials: include (HTTP-only cookie JWT)
[ Web server ] Application tier — Express + TypeScript REST API
     - Helmet, CORS (allowlist), rate limiting on /api/auth
     - Auth: JWT verify, RBAC authorize(roles...)
     - Zod validation on every mutating endpoint
     - Activity logging middleware/service
     - Modules: residents, households, certificates, fees, services, reports, users, backup
     |
[ Database ] Data tier — MongoDB via Mongoose
     - Collections: users, residents, households, puroks, classifications, certificateTypes,
       certificateRequests, issuedCertificates, payments, serviceCategories, serviceRecords,
       activityLogs, notifications, smsLogs, systemSettings, backupLogs
```

## Request flow

1. Browser → Next.js page (server component fetch or client SWR-style fetch to API).
2. API call includes HTTP-only cookie automatically (`credentials: 'include'`).
3. Express middleware: `helmet` → `cors` → `rateLimit` (auth routes) → `authenticate` →
   `authorize` → Zod validation → controller → service → Mongoose → response.
4. Mutations write an `activityLogs` entry (action, user, target, timestamp, IP).
5. Errors: centralized error handler returns `{ success:false, message }`; no stack traces in prod.

## Process model

- Sprint development, monorepo with `frontend/` and `backend/` run as separate processes.
- Frontend never talks to MongoDB directly; only the API does.
- Secrets only via environment variables (`backend/.env`, `frontend/.env.local`), never committed.

## Environments

- development: Atlas `abis` (current) or local MongoDB / memory server (`USE_MEMORY_DB=true`)
- production: HTTPS, strict CORS allowlist, `NODE_ENV=production`, secure cookies (`Secure`,
  `SameSite=Lax`), managed or local MongoDB (see docs/deployment/deployment-guide.md)

## Diagrams

Mermaid: `system-architecture.mmd` (layers) and `docs/database/erd.mmd` (entities).
