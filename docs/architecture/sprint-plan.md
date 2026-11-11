# ABIS — Sprint Plan

Methodology: Agile/Scrum (manuscript). Sprints map to master prompt Phase 3.
Verification per sprint: run app, `tsc --noEmit`, lint, manual smoke of new flows, fix before done.

| Sprint | Scope | Key deliverables | Depends on |
|---|---|---|---|
| 1 | Foundation & Auth | Monorepo, Express+Mongoose API, Next.js app, login/logout, RBAC, seed, dashboard shell, users admin (Secretary) | — |
| 2 | Resident Profiling | Residents CRUD, classifications, duplicate check, archive, Excel import/export, directory UI | S1 |
| 3 | Household Management | Households CRUD, head assignment, members, transfer, composition view | S2 |
| 4 | Certificate Requests | Certificate types, request flow, approval, control numbers, history | S2 |
| 5 | Certificate Generation & Fees | Templates, PDF, print, release tracking, fee/OR recording, issued history | S4 |
| 6 | Service Monitoring | Categories, service records, history, summaries | S2 |
| 7 | Dashboard & Reports | Live charts (population/gender/age/purok), 7 report types, PDF/Excel export, print | S2–S6 |
| 8 | Administration | Users admin completion, activity logs UI, settings, backup/restore + logs, notifications, SMS placeholder | S1–S7 |
| 9 | Integration & Refinement | E2E flows, permission audit, responsive pass, backup/restore verification | S1–S8 |
| 4/5 | Testing & Release | Alpha/beta testing docs, ISO 25010 evaluation support, deployment, manuals, turnover (Phase 5) | S9 |

**Current status:** Sprint 1 complete and verified end-to-end (2026-11-11). Phases 1–2 complete.
Phase 5 deployment target OPEN (see decisions.md D-6).
