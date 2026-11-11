# ABIS — System Scope

Approved scope. Source of truth: research manuscript + approved master prompt. Manuscript is primary; deviations in `docs/architecture/decisions.md`.

## In scope

1. **Resident profiling module**: centralized resident database, CRUD, search/filter/sort/pagination, classifications, duplicate prevention, archive/restore, Excel import/export.
2. **Household management module**: households, household head, members, transfers, household composition, search/filter.
3. **Certificate and document issuance module**: certificate type management, requests, approval workflow (Captain), control numbers, PDF generation/printing, release tracking.
4. **Fee recording (limited)**: certificate-related fees, OR numbers, payment status, issued-certificate history. NOT a full accounting system.
5. **Service monitoring module**: service categories, service records, per-resident history, summaries.
6. **Dashboard and reports module**: live DB-driven dashboard; population/demographic/household/classification/certificate-request/issued-certificate/service-monitoring reports; date/purok/classification filters; PDF/Excel export; print layouts.
7. **User management and administration**: authorized accounts (Secretary/Treasurer/Captain/Other), RBAC, activity logs, system settings, backup/restore (file-based export of collections), in-app notifications, SMS placeholder (disabled).
8. **Authentication**: secure login/logout, bcrypt, HTTP-only cookies, Helmet, rate limiting, RBAC on frontend and backend, activity logging.
9. **Data backup/restore**: timestamped export of collections to a file; restore with confirmation; backup history log.
10. **Documentation and evaluation support**: technical documentation; ISO/IEC 25010:2011 evaluation instruments (functional suitability, usability, reliability, maintainability); alpha/beta testing documentation.

## Out of scope (explicit)

- **Resident login accounts / resident portal** — residents are records; requests are processed at the Barangay Hall (approved master prompt; supersedes manuscript Figure 4 limited Resident account; see decisions.md D-14)
- **Public registration**
- **Mobile application** (web-based only; reasonable tablet layout is fine, no mobile app)
- **Full accounting / financial management system**
- **National government system integration** (DILG BIMS, CBMS/PSA, PhilSys, etc.)
- **Live SMS delivery** (Semaphore integration is a disabled placeholder only)
- **AI features or unrelated modules**
- **Actual ISO 25010 scoring/results fabrication**; evaluation is administered to real respondents only
- **Evaluation characteristics beyond the four** (functional suitability, usability, reliability, maintainability)

## Environment

- Barangay Hall PC(s) running a modern browser; server (deployment target decided at Release)
- MongoDB Atlas (development/staging): database `abis` on the configured cluster; production database and hosting decided in Phase 5
- Node.js 20+, npm workspaces monorepo

## Module dependency order

Users/Auth → Residents → Households → Certificate types/requests → Issuance + Fees → Services → Dashboard/Reports → Administration (logs, settings, backup) → Integration hardening.

## Success criteria (per manuscript + master prompt)

- All approved modules functional against the real database
- ISO/IEC 25010:2011 evaluation (4 characteristics) administered to end-users and 5 IT experts
- System turned over to Barangay Ambucao with training and documentation
