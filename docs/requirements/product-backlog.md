# ABIS — Product Backlog

Prioritized per the manuscript's Scrum phases. P0 = must have for a working system;
P1 = important; P2 = nice to have. IDs: ABIS-###.

## Sprint 1 — Foundation & Authentication
- [P0] ABIS-001 Repository monorepo (frontend/, backend/, docs/), env config, .gitignore
- [P0] ABIS-002 Express + TypeScript + Mongoose backend skeleton (config, db connection, error handling)
- [P0] ABIS-003 User model (bcrypt hash, role enum, active flag), ActivityLog model
- [P0] ABIS-004 Auth: login/logout, JWT in HTTP-only cookie, rate-limited endpoint, Helmet
- [P0] ABIS-005 RBAC middleware (authenticate + authorize by role); activity logging on login/logout/user actions
- [P0] ABIS-006 Seed script: initial Secretary account + roles documentation
- [P0] ABIS-007 Next.js + Tailwind + shadcn-style UI foundation; app layout, sidebar, breadcrumbs
- [P0] ABIS-008 Login page with validation + error handling; protected dashboard route
- [P0] ABIS-009 Dashboard shell (welcome, role-aware sidebar; no fake stats)
- [P1] ABIS-010 Users admin page (Secretary only): list, create, activate/deactivate, reset password
- [P1] ABIS-011 Frontend middleware redirect for unauthenticated users

## Sprint 2 — Resident Profiling
- [P0] ABIS-020 Resident model + indexes (name, purok, classification; duplicate detection)
- [P0] ABIS-021 Classification model (sector/class lists, e.g., senior citizen, PWD, solo parent, 4Ps, indigenous people, youth, voter) — lists to be confirmed with barangay
- [P0] ABIS-022 Residents CRUD API + validation (Zod) + pagination + search/filter/sort
- [P0] ABIS-023 Resident directory UI (table, TanStack Table), add/edit/view, archive/restore
- [P0] ABIS-024 Duplicate checking on create/update (name + birthdate + household/address heuristic)
- [P1] ABIS-025 Excel import (ExcelJS, template + row-level validation report) and export
- [P1] ABIS-026 Resident info reusable across modules (single source of truth; no copied fields)

## Sprint 3 — Household Management
- [P0] ABIS-030 Household model (household number, head resident ref, members, purok, address)
- [P0] ABIS-031 Household CRUD API + validation + search/filter + pagination
- [P0] ABIS-032 Household directory UI; create/edit; head assignment; member add/remove/transfer
- [P0] ABIS-033 Household details view (composition: members list, counts)
- [P1] ABIS-034 Household report data feeds (used later by reports sprint)

## Sprint 4 — Certificate Requests
- [P0] ABIS-040 CertificateType model (name, description, fee, approval required, active) — seeded with common PH set, editable
- [P0] ABIS-041 CertificateRequest model (resident ref, type, purpose, status, control number, requested/approved by, timestamps)
- [P0] ABIS-042 Request creation flow (search resident → auto-fill → submit)
- [P0] ABIS-043 Request workflow: pending → approved/rejected (Captain) → ready for release (Secretary); history
- [P0] ABIS-044 Requests UI: list, filters, detail, approve/reject with confirmation, history per resident
- [P1] ABIS-045 Control number generation (scheme TBD — see open questions)

## Sprint 5 — Certificate Generation & Fee Recording
- [P0] ABIS-050 Certificate templates (barangay letterhead/logo needed — placeholder until supplied)
- [P0] ABIS-051 PDF generation + print-friendly layout; auto-populated resident info
- [P0] ABIS-052 Certificate release tracking (issued/released status + released to whom)
- [P0] ABIS-053 Fee recording: amount, OR number, payment status, tied to certificate transaction
- [P0] ABIS-054 Issued certificates history (per resident, per date range)

## Sprint 6 — Service Monitoring
- [P0] ABIS-060 ServiceCategory model + seed list (to confirm with barangay; interim common list)
- [P0] ABIS-061 ServiceRecord model (resident ref, category, date, description, beneficiary info)
- [P0] ABIS-062 Services UI: add/list/search/filter; per-resident service history; summaries

## Sprint 7 — Dashboard & Reports
- [P0] ABIS-070 Dashboard: total residents/households, gender/age/purok/classification distribution (Recharts, live queries)
- [P0] ABIS-071 Reports: population, demographic, household, classification — date/purok/classification filters
- [P0] ABIS-072 Reports: certificate requests, issued certificates, services — date filters
- [P0] ABIS-073 Report export: PDF + Excel (ExcelJS) + print layout

## Sprint 8 — User Management & Administration
- [P0] ABIS-080 User directory (all roles), create/edit, role assignment, activate/deactivate, password reset
- [P0] ABIS-081 Activity logs viewer (filter by user/action/date; Secretary only)
- [P0] ABIS-082 System settings (barangay profile, letterhead data, control number scheme)
- [P0] ABIS-083 Database backup (mongodump or export) + restore; backupLogs collection + history UI
- [P1] ABIS-084 In-app notifications (e.g., pending approvals for Captain)
- [P1] ABIS-085 SMS placeholder (Semaphore) — inert, no sending, no fake success

## Sprint 9 — Integration & Refinement
- [P0] ABIS-090 End-to-end flows: resident → household → cert request → issue → fee → report
- [P0] ABIS-091 Permission audit, validation audit, duplicate-prevention verification
- [P0] ABIS-092 Error handling, loading/empty/error states, responsive layout pass
- [P0] ABIS-093 Backup/restore verification; logout/session expiry verification

## Phase 4/5 — Testing & Release (docs)
- ABIS-100 test-plan.md, test-cases.md, defect-log.md, testing-report.md, evaluation-support.md
- ABIS-110 Deployment docs, user manual, administrator manual, backup instructions, turnover docs

## Open questions
See `docs/requirements/requirements.md` §open items and `docs/architecture/decisions.md` D-list.
