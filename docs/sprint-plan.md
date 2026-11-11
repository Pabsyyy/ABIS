# ABIS — Sprint Plan (Phase 2 / estimated)

Scrum, one week per sprint (indicative). Verification per sprint: `npm run typecheck`, `npm run lint`, frontend build, backend typecheck, runtime smoke of acceptance criteria; defects logged.

| # | Sprint | Objective | Dependencies | Deliverables | Key acceptance criteria | Estimate |
|---|---|---|---|---|---|---|
| 1 | Foundation & Authentication | Monorepo, API+DB, auth, RBAC, shell UI | — | Working full-stack shell | AC-1.x | 5 d |
| 2 | Resident Profiling | Residents CRUD/search/archive/import/export | S1 | Resident module | AC-2.x | 5 d |
| 3 | Household Management | Households, members, transfers, composition | S2 | Household module | AC-3.x | 4 d |
| 4 | Certificate Requests | Types, requests, approval workflow, history | S2 | Request module | AC-4.x | 4 d |
| 5 | Certificate Generation & Fees | PDF issue, control numbers, release, fees/OR | S4 | Certificates + payments | AC-5.x | 4 d |
| 6 | Service Monitoring | Categories, records, history, summaries | S2 | Services module | AC-6.x | 3 d |
| 7 | Dashboard & Reports | Live charts, 7 reports, Excel/PDF export, print | S2–S6 | Dashboard + reports | AC-7.x | 5 d |
| 8 | Administration | Users, logs, settings, backup/restore, notifications, SMS stub | S1–S7 | Admin module | AC-8.x | 4 d |
| 9 | Integration & Refinement | Cross-module links, audits, UX pass, backup verification | S1–S8 | Integrated app | AC-9.x | 4 d |

Phases 4–5 follow: alpha/beta testing + ISO 25010 evaluation instruments + release docs (deployment, manuals, turnover).

Risk register: barangay form-field confirmation (D-10) — blocks final PDF templates; letterhead assets (D-12) — blocks branded certificates; purok list (D-11) — blocks polished household/purok pickers; control-number scheme (D-9) — settings make it configurable; Atlas IP allowlist for production machine; RA 10173 sign-off for any resident data encoding.
