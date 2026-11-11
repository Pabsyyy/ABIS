# ABIS — Product Backlog

Format: ID | Feature | Description | Priority | Module | Dependencies | Acceptance Criteria.

Priority: P0 (must), P1 (important), P2 (nice to have).

## Sprint 1 — Project Foundation and Authentication

ABIS-001 | Monorepo setup | npm workspaces (frontend/ + backend/), env configs, lint/typecheck scripts | P0 | Foundation | — | Root `npm run dev|typecheck|lint|build` works; both apps compile clean
ABIS-002 | Express + Mongoose backend | Config, DB connector, error handler, Helmet, CORS, rate limit, cookie parser, auth routes | P0 | Foundation | ABIS-001 | Server boots; connects to MongoDB; /api/health 200
ABIS-003 | Authentication | Login (username/password), bcrypt, JWT HTTP-only cookie, logout, /me, session expiry, login rate limit | P0 | Auth | ABIS-002 | Valid login 200 + cookie; invalid 401; limiter 429 after 20 attempts/15min
ABIS-004 | RBAC middleware | authenticate + authorize(...roles); 401/403 enforced server-side | P0 | Auth | ABIS-003 | Treasurer→Secretary-only route = 403; unauthenticated = 401
ABIS-005 | Next.js frontend shell | Tailwind, shadcn-style components, palette, layout, sidebar (role-aware), breadcrumbs, GSAP login entrance, show/hide password | P0 | Foundation | ABIS-001 | `/login` renders; unauthenticated `/dashboard` → 307 to `/login`
ABIS-006 | Users admin (Secretary only) | List, create, activate/deactivate, reset password; forced password change on reset | P0 | Administration | ABIS-003,004 | Secretary manages accounts; others blocked; deactivation blocks login
ABIS-007 | Protected routes | Frontend middleware + client guard via /auth/me | P0 | Auth | ABIS-005 | Deep-link to protected page redirects to /login

## Sprint 2 — Resident Profiling

ABIS-020 | Resident model + API | Schema (names, birthdate, sex, civil status, purok, address, contact, occupation, income, classifications, household link, archived flag), indexes, Zod validation, pagination/search/filter/sort | P0 | Residents | ABIS-003 | CRUD works; duplicates warned not created
ABIS-021 | Classifications | Seed senior/pwd/solo_parent/4ps/indigenous/youth/below_poverty_line; admin seed; API read | P0 | Residents | ABIS-020 | Classifications listed and filterable
ABIS-022 | Resident UI | Directory with search/filter/sort/pagination; add/edit/view; archive/restore with confirmation | P0 | Residents | ABIS-020 | End-to-end add→view→edit→archive works
ABIS-023 | Duplicate prevention | Application-level name+birthdate match on create/update/import; block or warn | P0 | Residents | ABIS-020 | Duplicate attempt reported, not silently created
ABIS-024 | Excel import/export | ExcelJS; export directory; import with row-level validation report | P1 | Residents | ABIS-020 | Valid import creates records; invalid rows reported with reasons
ABIS-025 | Resident reports feed | Counts/distributions consumed by Sprint 7 | P0 | Residents | ABIS-020 | Sprint 7 queries residents collection correctly

## Sprint 3 — Household Management

ABIS-030 | Household model + API | householdNumber (unique), headResident (ref), members[], purok, address, status | P0 | Households | ABIS-020 | CRUD works; duplicate household number rejected
ABIS-031 | Household UI | Directory, create/edit, head assignment, member add/remove/transfer, composition (sex/age counts) | P0 | Households | ABIS-030 | Members shown; transfers preserve resident records
ABIS-032 | Household search/filter | By purok/head/number | P0 | Households | ABIS-030 | Search returns correct subsets

## Sprint 4 — Certificate and Document Requests

ABIS-040 | Certificate types | Model + seed (common PH set, editable); manage UI for Secretary | P0 | Certificates | ABIS-003 | Seeded list visible; Secretary can add/edit/toggle
ABIS-041 | Request model + API | resident ref, type ref, purpose, status, controlNumber, requestedBy, approvedBy, notes | P0 | Certificates | ABIS-020,ABIS-040 | Create/list/detail/approve/reject endpoints with validation
ABIS-042 | Request flow UI | Search resident → auto-fill → submit; pending list; detail; approve/reject with reason (Captain/Secretary); history | P0 | Certificates | ABIS-041 | Full flow works; statuses enforce valid transitions
ABIS-043 | Control numbers | Settings-driven scheme (default ABIS-YYYY-NNNNN); unique sparse index | P1 | Certificates | ABIS-041 | Issued certificate gets next control number

## Sprint 5 — Certificate Generation and Fee Recording

ABIS-050 | Certificate templates | PDF via pdfkit; letterhead text from settings (barangay name, captain, municipality, logo placeholder) | P0 | Certificates | ABIS-041 | PDF renders with resident data; prints cleanly
ABIS-051 | Issue + release tracking | Issue action assigns control number + PDF; ready_for_release → released; releasedTo/releasedAt recorded | P0 | Certificates | ABIS-050 | Issued history per resident and date range
ABIS-052 | Fee recording | Record amount, OR number, payment status; linked to issued certificate; Treasurer+Secretary can record | P0 | Fees | ABIS-051 | Payment saved; receipt number shown; status updates
ABIS-053 | Issued certificates UI | Search/filter; detail; print/download PDF; payment badge | P0 | Certificates | ABIS-052 | Print/download works; payment reflected

## Sprint 6 — Service Monitoring

ABIS-060 | Service categories | Model + seed (medical/financial/burial/livelihood/senior/pwd/solo/4ps/disaster/indigency/other); admin manage | P0 | Services | ABIS-003 | Categories seeded; Secretary can add/toggle
ABIS-061 | Service records API | resident ref, category ref, date, description, beneficiary info, recordedBy, notes; validation | P0 | Services | ABIS-020,ABIS-060 | CRUD works; history per resident
ABIS-062 | Services UI | List/search/filter; add (search resident); detail; per-resident history; summaries | P0 | Services | ABIS-061 | Full flow works

## Sprint 7 — Dashboard and Reports

ABIS-070 | Dashboard | Live: total residents, households, pending requests, issued (filters), services; charts: sex/age/purok/classification distribution; Recharts | P0 | Dashboard | ABIS-020..061 | All figures from DB queries; cross-check counts against DB
ABIS-071 | Reports API | 7 report types with date/purok/classification filters; aggregation pipelines | P0 | Reports | ABIS-020..061 | Filtered results correct on spot check
ABIS-072 | Report UI + export | Reports page tables/charts; Excel export (ExcelJS); PDF export (pdfkit); print CSS | P0 | Reports | ABIS-071 | Exported files open and match on-screen data

## Sprint 8 — User Management and Administration

ABIS-080 | Users admin complete | Filters (role/status), pagination, role assignment, activate/deactivate, reset password | P0 | Administration | ABIS-006 | Exists; re-verified
ABIS-081 | Activity logs viewer | Secretary-only list with user/action/date filters | P0 | Administration | ABIS-003 | Filters work; entries recorded for module actions
ABIS-082 | System settings | Singleton settings (barangay profile, leader, control-number scheme, SMS toggle-disabled, letterhead text) | P0 | Administration | ABIS-003 | Settings persist and affect PDFs/numbering
ABIS-083 | Backup and restore | Export all collections to timestamped JSON file in backups/; restore with password confirmation; backupLogs record + UI history | P0 | Administration | ABIS-082 | Backup file created; restore onto clean DB reproduces users/residents; history listed
ABIS-084 | In-app notifications | Notification model; captain notified on pending approval; unread badge | P1 | Administration | ABIS-041 | Approve flow creates notification; badge clears on read
ABIS-085 | SMS placeholder | smsLogs collection; settings flag; stub service returns disabled; no sending | P1 | Administration | ABIS-082 | Endpoint returns disabled status; nothing sent

## Sprint 9 — Integration and Refinement

ABIS-090 | Cross-module integration | Sidebar/nav complete; all modules cross-link (resident→households/requests/issued/services) | P0 | Integration | ABIS-020..062 | Navigate resident→all related records without dead ends
ABIS-091 | Permission audit | Every route checks role; Treasurer blocked from writes; Captain limited; Other role empty access | P0 | Integration | ALL | Adversarial curl checks pass (403/401 as designed)
ABIS-092 | UX pass | Loading/empty/error states everywhere; confirmations on destructive actions; responsive pass | P0 | All | ABIS-020..085 | Manual checklist green
ABIS-093 | Known issues + integration test results | Integration-test-report.md; known-issues list | P0 | Integration | ABIS-090..092 | Reports committed in docs/testing/

## Phase 4/5

ABIS-100 | Alpha testing docs | test-plan, test-cases, results with ACTUAL executed outcomes | P0 | Testing | ABIS-090 | docs/testing/*.md filled with real results
ABIS-101 | Security testing | RBAC/validation/rate-limit checks; report | P0 | Testing | ABIS-090 | Report committed
ABIS-102 | Beta/ISO 25010 package | Instruments prepared; real administration by barangay users + 5 IT experts pending; NO fabricated scores | P0 | Testing | ABIS-090 | Instruments ready; report notes pending fieldwork
ABIS-103 | Release docs | Deployment guide, production checklist, user manual, administrator guide, backup/restore guide, troubleshooting, turnover | P0 | Release | ABIS-100 | docs/deployment/, docs/documentation/, docs/turnover/ present
