# ABIS — Functional Requirements

ID format FR-{module}-{n}. Source: research manuscript (Ch. I objectives, Survey Questionnaire Appendix B, interview/observation appendices, System Architecture Figure 3/4) and the approved development master prompt.

## FR-1 Resident Profiling Module
- FR-1.1 Maintain a centralized resident database; record fields consistent with barangay forms (name, birthdate, sex, civil status, purok, address, contact, occupation, classifications, household link).
- FR-1.2 Add, view, edit, search, filter and sort resident records; paginate list views.
- FR-1.3 Resident classifications (sector/class): senior citizen, PWD, solo parent, 4Ps, indigenous people, youth, below poverty line (seeded; admin-manageable; actual keys to be confirmed with the barangay).
- FR-1.4 Prevent duplicate resident records (name + birthdate heuristic warning on create/update; import reports duplicates).
- FR-1.5 Archive (soft delete) and restore resident records.
- FR-1.6 Excel import (with row-level validation report) and Excel export.
- FR-1.7 Resident information stored once and referenced by certificate/service/household modules.

## FR-2 Household Management Module
- FR-2.1 Household records: unique household number, address, purok, head of household (resident reference).
- FR-2.2 Link residents to households; display household members; compute composition (member count by sex/age group).
- FR-2.3 Transfer residents between households.
- FR-2.4 Search/filter households; view household details and membership history where feasible.

## FR-3 Certificate and Document Issuance Module
- FR-3.1 Manage certificate types (name, description, fee, requires-approval flag, template, active).
- FR-3.2 Record certificate requests; select resident from the directory; resident information auto-retrieved (no re-encoding).
- FR-3.3 Request status workflow: pending → approved/rejected (Barangay Captain) → issued/ready for release → released; cancellation allowed by Secretary.
- FR-3.4 Assign control numbers to issued certificates (format per system settings; default `ABIS-YYYY-NNNNN`).
- FR-3.5 Issue history per resident and per date range.

## FR-4 Certificate Generation and Fee Recording (limited scope)
- FR-4.1 Generate printable certificates (PDF) populated from resident data, with barangay letterhead/logo.
- FR-4.2 Record fees tied to certificate transactions only: amount, official receipt (OR) number, payment status (paid/unpaid/waived).
- FR-4.3 Issued-certificate and payment history. This is NOT a full accounting system.

## FR-5 Service Monitoring Module
- FR-5.1 Manage service categories (seeded list; admin-manageable).
- FR-5.2 Record services delivered to residents (date, category, description, beneficiary info where required).
- FR-5.3 Search/filter service records; view per-resident service history; service summaries.

## FR-6 Dashboard and Reports Module
- FR-6.1 Dashboard with live database figures: total residents, households, certificate summaries, service summaries, population by purok / sex / age group / classification.
- FR-6.2 Reports: population, demographic, household, classification, certificate request, issued certificate, service monitoring — with date range, purok and classification filters.
- FR-6.3 Export to Excel (ExcelJS) and PDF; print-friendly report layouts.
- FR-6.4 No hardcoded statistics; all figures from real DB queries.

## FR-7 User Management and Administration
- FR-7.1 Account management: create/edit, activate/deactivate (no deletion of accounts with audit history), password reset with forced change on next login.
- FR-7.2 Role assignment restricted to approved roles: Secretary, Treasurer, Captain, Other (zero default permissions).
- FR-7.3 Activity logs for all important actions (who/what/when; never passwords).
- FR-7.4 System settings (barangay profile, control-number scheme, letterhead text).
- FR-7.5 Database backup (export of all collections to timestamped file) and restore with confirmation; backup history (`backupLogs`).
- FR-7.6 In-app notifications (e.g., pending certificate approvals for the Captain).
- FR-7.7 SMS integration placeholder only (Semaphore) — disabled; no sending, no fake success.

## FR-8 Authentication and Authorization
- FR-8.1 Username/password login; bcrypt-hashed passwords; secure HTTP-only cookie session; logout.
- FR-8.2 Rate-limited login endpoint; Helmet security headers; CORS allowlist.
- FR-8.3 Role-based access control enforced on frontend and backend.
- FR-8.4 Protected routes on both tiers; backend returns 401/403 for unauthenticated/unauthorized calls.

## FR-9 Traceability
- FR-9.1 Certificate requests reference `residents._id`; service records reference `residents._id` and `serviceCategories._id`; payments reference `issuedCertificates._id`.
- FR-9.2 Activity logs reference `users._id`.
