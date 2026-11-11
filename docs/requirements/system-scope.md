# ABIS — System Scope

## In scope

1. Resident profiling module (FR-1): centralized resident database, CRUD, search/filter/sort,
   classifications, duplicate prevention, archive/restore, Excel import/export.
2. Household management module (FR-2): households, household head, members, transfers, search.
3. Certificate and document issuance module (FR-3): certificate types, requests, approval flow,
   control numbers, PDF generation and printing, release tracking.
4. Fee recording limited to certificate transactions (FR-4): amount, OR number, payment status,
   issued-certificate history. Not a full accounting system.
5. Service monitoring and reporting module (FR-5, FR-6): service categories and records, service
   history/summaries, dashboard with live DB queries, printable/PDF/Excel reports.
6. User management and administration (FR-7): user accounts, RBAC, activity logs, system
   settings, backup/restore with history, in-app notifications, SMS placeholder (inert).
7. Authentication and security (FR-8, FR-9): bcrypt, HTTP-only cookie JWT, Helmet, rate limiting,
   RBAC frontend + backend, activity logging.
8. Limited Resident self-service login (FR-10) as defined by the manuscript (own requests, own
   profile, own issued documents, correction requests).

## Out of scope

- Full accounting / financial transaction computerization.
- Mobile application (web-based only).
- Integration with national government systems (DILG BIMS, CBMS/PSA, PhilSys, etc.).
- E-signature / digital certificates from external CAs.
- Online payment processing (fees are recorded, not collected online).
- Any resident capability beyond FR-10.
- SMS sending (placeholder only; no live integration, no fake successful transactions).
- Evaluation characteristics beyond functional suitability, usability, reliability, maintainability.

## Module dependency order

Users/Auth → Residents → Households → Certificate types/Requests → Certificate issuance + Fees →
Services → Dashboard/Reports → Administration (users, logs, backup) → Integration hardening.

## Deployment target

To be confirmed: barangay hall PC(s) vs. hosted server. Initial development targets a local
deployment; production hardening happens in Release phase. MongoDB required (local install or
managed, e.g., Atlas); no MongoDB is currently installed on the development machine — a local
dev instance or mongodb-memory-server is used for testing (see decisions.md D-6).

## Success criteria (per manuscript)

- All modules functional end-to-end with real DB queries.
- ISO/IEC 25010:2011 evaluation (4 characteristics) administered to end-users and 5 IT experts.
- System turned over to Barangay Ambucao with training and documentation.
