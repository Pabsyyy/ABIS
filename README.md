# ABIS — Integrated Barangay Information System

ABIS is a web-based Integrated Barangay Information System for **Barangay Ambucao, Santiago,
Ilocos Sur, Philippines**. It centralizes resident profiling, household management, certificate
and document issuance, service monitoring, and reporting, under role-based access, for authorized
barangay officials and staff (and the limited Resident self-service role defined by the research
manuscript).

Primary reference: `Research_Proposal_kitan_u_mannu_usto.docx` (research proposal). Development
decisions and manuscript deviations are recorded in `docs/architecture/decisions.md`.

## Tech stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui-style components,
  GSAP (subtle animations), Lucide icons, React Hook Form, Zod, TanStack Table, Recharts
- **Backend:** Node.js, Express.js, TypeScript, REST API, Mongoose
- **Database:** MongoDB
- **Other:** bcrypt, JWT in HTTP-only cookies, Helmet, express-rate-limit, ExcelJS,
  PDF generation, date-fns, Semaphore SMS placeholder (disabled)

## Repository layout

```
abis/
├── frontend/            # Next.js app (App Router)
├── backend/             # Express + Mongoose API
├── docs/
│   ├── requirements/    # requirements, backlog, roles, scope
│   ├── architecture/    # architecture, auth design, decisions, sprint plan
│   ├── database/        # database-design.md
│   ├── workflows/       # initial-workflows.md
│   ├── api/             # api-documentation.md
│   └── testing/         # test-plan, test-cases, defect-log (Phase 4)
├── .gitignore
└── README.md
```

## Getting started (development)

Prerequisites: Node.js 20+, MongoDB (local service or `MONGODB_URI` to a reachable instance/Atlas). The repo uses **npm workspaces** — one install covers both apps.

```bash
npm install               # installs frontend + backend (from repo root)
npm run dev               # starts backend (:5000) and frontend (:3000) together
```

Or run them separately: `npm run dev:backend` and `npm run dev:frontend`.

Other root scripts: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run seed`.

Backend environment lives in `backend/.env` (copy `backend/.env.example`); set `MONGODB_URI`,
`JWT_SECRET`, and the seed credentials. With `USE_MEMORY_DB=true` (default dev setup) the backend
boots an ephemeral in-memory MongoDB and auto-creates the initial secretary account on startup;
data is lost on restart. Set `USE_MEMORY_DB=false` and run `npm run seed` for a persistent DB.
Frontend env lives in `frontend/.env.local` (copy `frontend/.env.local.example`).

## Status

- Phase 1 (Initiation) — complete: docs/requirements, docs/workflows, product backlog.
- Phase 2 (Planning) — complete: architecture, database design, API outline, auth design, sprint plan.
- Sprint 1 (Foundation & Authentication) — complete and verified (login/logout, RBAC, users admin, dashboard shell).
- Remaining sprints — see docs/requirements/product-backlog.md.

## Rules

- Residents do not manage the system; Resident role (if enabled) is limited self-service.
- No passwords in plain text; no secrets committed; `.env` is git-ignored.
- All dashboard figures come from the database.
- SMS is a placeholder only; it does not send messages.
