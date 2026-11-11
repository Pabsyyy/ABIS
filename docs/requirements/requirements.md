# ABIS — Requirements

Source of truth: `Research_Proposal_kitan_u_mannu_usto.docx` (research proposal for the
"Integrated Barangay Information System for Enhanced Resident Profiling, Service Delivery,
and Data-Driven Governance in Ambucao, Santiago, Ilocos Sur", Ilocos Sur Polytechnic State
College, CS 404 Project Study 1). Where the manuscript and the development master prompt
conflict, the user-approved resolution is recorded in `docs/architecture/decisions.md`.

## 1. Problem statement (manuscript, Ch. I)

Barangay Ambucao relies on manual, paper-based records and logbooks for resident profiling,
certificate issuance, and service monitoring. Problems: disorganized documents, slow retrieval,
fading/lost records, duplicate records, long processing time, no backup, reports compiled
manually, unauthorized access to records.

## 2. Functional requirements (modules)

| # | Module | Requirements |
|---|--------|--------------|
| FR-1 | Resident profiling | Centralized resident records; add/edit/search/filter/sort; classifications (sector: senior citizen, PWD, solo parent, etc.); duplicate checking; archive/restore; Excel import/export; resident profile reused across modules (no re-encoding). |
| FR-2 | Household management | Household records with household number; household head assignment; household members; transfer residents between households; search/filter; household composition. |
| FR-3 | Certificate & document issuance | Certificate type management; request creation; select resident and auto-retrieve profile; request status tracking; approval/rejection per approved responsibilities; request history; control number assignment; printed certificates (PDF) with barangay letterhead; certificate release tracking. |
| FR-4 | Fee recording | Record certificate fees, receipt reference/number, payment status; issued-certificate history. Limited to fee/receipt recording tied to certificates — NOT a full accounting system. |
| FR-5 | Service monitoring | Service categories; add service record (date, description, resident, beneficiary where required); service history; search/filter; service summaries. |
| FR-6 | Dashboard & reports | Live statistics from DB (residents, households, population/gender/age-group/purok distribution, certificate and service summaries). Reports: population, demographic, household, classification, certificate request, issued certificate, service monitoring; date/purok/classification filters; PDF/Excel export; print layouts. No hardcoded stats. |
| FR-7 | User management & admin | User directory; create/edit user; assign authorized role; activate/deactivate; password reset; activity logs; system settings; database backup/restore with backup history; in-app notifications; SMS integration placeholder (Semaphore, disabled). |
| FR-8 | Authentication | Secure login/logout for authorized accounts; hashed passwords; HTTP-only cookies; role-based access control on frontend and backend; rate-limited auth endpoints. |
| FR-9 | Activity logging | Important actions logged (who, what, when); no passwords/secrets logged. |
| FR-10 | Resident self-service (limited) | Per manuscript Figure 4 / System Architecture: Resident account can submit requests, track own request status, view own profile and issued documents, request correction of own record. Cannot view other residents, reports, or accounts. |

## 3. Non-functional requirements

- **NFR-1 ISO/IEC 25010:2011 (evaluation scope — 4 characteristics only):** functional
  suitability, usability, reliability, maintainability. Performance efficiency, compatibility,
  security, portability are NOT part of the evaluation instrument (security measures are still
  implemented).
- **NFR-2 Security:** passwords hashed (bcrypt); JWT in HTTP-only cookies; Helmet; rate limiting
  on auth; input validation frontend + backend; RBAC enforced server-side; no secrets in repo.
- **NFR-3 Privacy / legal:** Data Privacy Act of 2012 (RA 10173) compliance; role-based access so
  only authorized officials/staff access resident records; residents encoded only with written
  authorization of the Punong Barangay; database turned over to the barangay at study end.
- **NFR-4 Usability:** simple, practical for personnel with varying computer experience; minimal
  training; clear feedback/messages; consistent UI.
- **NFR-5 Reliability:** consistent operation; data accuracy after repeated use;
  backup/restore capability; no data loss on interruption.
- **NFR-6 Maintainability:** modular (profiling / certificates / services / reports); updated or
  modified easily; clear error instructions.
- **NFR-7 Web-based:** runs in a browser; no mobile app; no national-government-system
  integration; no Internet-facing resident portal required beyond the limited Resident login
  (see decisions.md).

## 4. Explicit exclusions (manuscript + master prompt)

- No computerization of financial/accounting transactions (fee receipt recording only).
- No mobile application.
- No integration with national government information systems (e.g., DILG BIMS, CBMS/PSA).
- No resident access beyond the limited Resident role described in FR-10.
- Evaluation limited to the four ISO/IEC 25010 characteristics named above.

## 5. Environment / context

- Locale: Barangay Ambucao, Santiago, Ilocos Sur, Philippines.
- Users: barangay officials and staff (total enumeration, n=10); household-head respondents
  (n=25, stratified random); 5 IT experts. System operated by authorized officials/staff.
- Development: Agile (Scrum), phases: Initiation → Planning/Estimation → Sprint Development →
  Review/Retrospective → Release.
- Architecture (manuscript): three-tier — presentation (browser) / application (web server:
  auth, RBAC, validation, logging, modules) / data (DB).
- Technology deviation (approved): MongoDB + Mongoose instead of manuscript's MySQL.
