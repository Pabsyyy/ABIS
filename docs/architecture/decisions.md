# ABIS — Architecture Decisions & Manuscript Deviations

Record of decisions where development reality or barangay needs diverge from the manuscript.
Each deviation approved by the project owner (user decision) unless marked "OPEN".

D-1. **Database: MongoDB + Mongoose (approved).** Manuscript System Architecture specifies MySQL
   "which also keeps the activity logs and backup files". Approved stack uses MongoDB. Activity
   logs remain a MongoDB collection (`activityLogs`); backups are `mongodump`-style file dumps
   tracked in `backupLogs` (MongoDB cannot file-dump inside itself). Manuscript backup wording
   adapted, scope unchanged.

D-2. **Resident accounts: REMOVED (superseded by D-14).** Earlier approved; no longer valid.

D-3. **Certificate types: common PH set, editable (approved).** Manuscript does not list the
   actual certificate types used by Barangay Ambucao. Initial seed (all editable by Secretary):
   Barangay Clearance, Certificate of Residency, Certificate of Indigency, Certificate of
   Business Clearance, Certificate of Good Moral Character, Barangay ID, Cedula (community tax
   certificate), Indigency for medical/financial assistance. Fees default 0 until the barangay
   supplies actual schedule. Confirm with barangay before Release.

D-4. **Evaluation scope unchanged.** Four ISO/IEC 25010:2011 characteristics only (functional
   suitability, usability, reliability, maintainability). Methodology text mentioning
   "performance, security" treated as descriptive overflow; limitations and Appendix B-2 govern.

D-5. **SMS: inert placeholder.** Semaphore integration prepared as a stub service; no sending,
   no success simulation. No SMS routes enabled by default.

D-6. **Development database.** No MongoDB/Docker on the development machine at Sprint 1 time.
   Backend supports any `MONGODB_URI`; for local verification and automated checks, a
   `mongodb-memory-server`-based dev/test fallback may be used. Production requires a real
   MongoDB (local service or Atlas) — configured in Release phase. No fake data layer is ever
   shown as real output.

D-7. **"Other Authorized Personnel" role (master prompt)** implemented as `other` role with
   zero default permissions until the barangay defines assignments. OPEN: barangay to define.

D-8. **Three-tier architecture retained** (presentation browser / application server / data),
   matching manuscript Figure 3, adapted to Next.js + Express + MongoDB.

D-9. **Control number scheme** OPEN: not specified in manuscript. Interim format:
   `ABIS-YYYY-NNNNN` (per-year sequence). Confirm with barangay (may need OR-based numbering).

D-10. **Household/resident form fields** OPEN: the manuscript references "resident profiling
   forms" and "household monitoring records" as actual documents used by the barangay but does
   not reproduce their fields. Initial resident schema covers standard PH barangay profiling
   fields (name, birthdate, sex, civil status, purok, address, contact, classifications,
   occupation, income bracket, etc.) and MUST be validated against the actual barangay forms
   before Release. Barangay to supply/confirm field lists.

D-11. **Purok list** OPEN: not specified. `puroks` collection will be seeded empty + admin-managed;
   initial entries to be supplied by the barangay.

D-12. **Barangay letterhead/logo** OPEN: needed for certificate PDF. Placeholder text layout used
   until official assets are supplied.

D-13. **Receipt (OR) numbering** OPEN: barangay official receipt series unknown; recorded as free
   text input by Treasurer/Secretary until confirmed.

D-14. **Resident accounts REMOVED (user-approved, supersedes D-2).** The approved master prompt
   states: "Residents are records in the system, not user login accounts", "Residents submit
   requests at the Barangay Hall. Do not create a public resident portal", "Do not introduce
   additional user types without authorization." The limited Resident role defined by the
   manuscript (Figure 4) is dropped from development. Implementation: `resident` removed from
   USER_ROLES and from the users admin UI; all resident-record access is staff-only
   (Treasurer/Captain read-only; Secretary full). Requests are encoded by the Secretary on the
   resident's behalf at the hall. If self-service is ever wanted later, it requires explicit
   written approval and scope change — not part of this build.

D-15. **Secrets in chat.** Atlas password `PabsLaptop` was shared in chat during configuration.
   Stored only in `backend/.env` (git-ignored). Rotate the Atlas user password after
   development; rotate the temporary `testadmin` secretary account password on first login.

D-16. **Development/verification database.** Verification runs against a throwaway Atlas
   database (`abis_verify`), created before testing and dropped afterward, so `abis` (the live
   development database) is never polluted with test records. `mongodb-memory-server` remains
   available as an offline fallback (`USE_MEMORY_DB=true`) but is not the default.

D-17. **Backup implementation.** No `mongodump` on the development machine. Backup =
   application-level export of all collections to a timestamped JSON file under `backend/backups/`
   (git-ignored); restore requires password re-confirmation and replaces collections wholesale.
   Backup metadata recorded in `backupLogs`. Meets FR-7.5/NFR-9 without shelling out to MongoDB
   tooling.

D-18. **Test data policy.** No fabricated resident records are inserted into `abis`. Alpha
   testing uses synthetic, obviously-fictional data in `abis_verify` only, which is dropped after
   testing. ISO/IEC 25010 evaluation scores are NOT fabricated — instruments prepared; actual
   administration with respondents pending.

D-19. **Seed accounts.** Atlas `abis` currently holds only `testadmin` (role secretary), created
   during Sprint 1 verification. The seed script additionally creates the `secretary`, `treasurer`,
   and `captain` accounts ONLY IF ABSENT, using env-provided credentials that MUST be changed
   before deployment (`.env.example` documents placeholders). No treasurer/captain accounts exist
   in `abis` yet.

D-20. **Resident self-service restored (user decision).** After D-14 removed resident logins,
   the user explicitly requested the resident role back with the manuscript's limited
   self-service: own profile, own requests (create/track/view), own issued documents (PDF),
   correction requests to the Secretary (field whitelist), enforced by `authorize('resident')`
   and `req.user.residentRef`. Staff routes unchanged (resident 403 everywhere else).
   Migration: `residentRef` (sparse unique) added to users; `correctionRequests` collection;
   `meRoutes` under `/api/me/*`; resident nav limited to My Requests / My Profile; Secretary gets
   Approval queue at `/corrections` + notifications. All test artifacts created for verification
   (test resident, test account, issued cert, request, correction) were removed after testing.

D-21. **Resident account linking made optional (user decision).** The User Management page no
   longer requires (or offers) linking a resident record to a resident account. Backend no
   longer requires `residentRef` on create. Note the consequence: a resident account without a
   linked record can sign in and change its password but cannot access /api/me/* (profile,
   requests, issued documents, corrections) — those endpoints require a linked resident. Linking
   can still be set via the API (`residentRef`) by an administrator if the barangay wants
   self-service for specific residents; UI support for linking was removed per user request.

D-22. **Resident account linking restored (user decision, supersedes D-21).** User Management
   again requires a `residentRef` for role=resident on create and update; the create form
   includes a resident picker and each resident row offers a Link/Change-link modal. Existing
   unlinked accounts (e.g. `denver`) can be linked once a resident record exists. Backend
   rejects resident accounts without a link and enforces one account per resident record.

D-23. **Login session policy (user decision).** The redesigned login page (matching LOGIN.png)
   offers a functional "Remember me": checked → 30-day JWT + 30-day HTTP-only cookie; unchecked
   → session cookie with the default JWT_EXPIRES_IN (12h). "Forgot Password?" opens a
   modal instructing the user to contact the Barangay Secretary (no email/SMS reset channel).
   Login redirects residents to /my-requests and staff to a validated ?next path or /dashboard.
