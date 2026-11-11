# ABIS — Architecture Decisions & Manuscript Deviations

Record of decisions where development reality or barangay needs diverge from the manuscript.
Each deviation approved by the project owner (user decision) unless marked "OPEN".

D-1. **Database: MongoDB + Mongoose (approved).** Manuscript System Architecture specifies MySQL
   "which also keeps the activity logs and backup files". Approved stack uses MongoDB. Activity
   logs remain a MongoDB collection (`activityLogs`); backups are `mongodump`-style file dumps
   tracked in `backupLogs` (MongoDB cannot file-dump inside itself). Manuscript backup wording
   adapted, scope unchanged.

D-2. **Resident accounts: ENABLED (approved).** The master prompt stated residents have no login;
   the manuscript (Figure 4, System Architecture) defines a limited Resident account. Project
   owner chose the manuscript. Resident role implemented with strict limits: own requests, own
   profile, own issued documents, correction requests. No access to other residents, reports,
   user accounts, or admin functions.

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
