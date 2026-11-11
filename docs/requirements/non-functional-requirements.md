# ABIS — Non-Functional Requirements

ID format NFR-{n}. Source: manuscript (Limitations, Data Privacy Act references, Evaluation Questionnaire Appendix B-2) and approved master prompt.

NFR-1 Usability — The system must be usable by barangay personnel with varying computer experience; simple navigation, consistent layout, clear feedback, minimal training (target: operation with minimal training; aligns with ISO/IEC 25010 usability evaluation).
NFR-2 Reliability — Consistent behavior on repeated use; data accuracy after repeated use; recoverable after unexpected interruption; backups must restore a consistent state (reliability evaluation; see backup/restore requirements FR-7.5).
NFR-3 Maintainability — Modular architecture (profiling/certificates/services/reports separable); TypeScript throughout; documented APIs and database schema; clear error messages that instruct the user (aligns with ISO/IEC 25010 maintainability evaluation).
NFR-4 Functional suitability — All approved modules perform their specified functions correctly (functional suitability evaluation; reported as in FR-*).
NFR-5 Security — Passwords bcrypt-hashed; JWT in HTTP-only cookies (`Secure`+`SameSite=Lax` in production); Helmet; rate limiting on auth endpoints; server- and client-side validation (Zod); RBAC enforced server-side; no secrets in source or logs; RA 10173 (Data Privacy Act 2012) compliance: role-based access, minimum necessary data, records encoded only with written authorization of the Punong Barangay, database turned over to the barangay at study end.
NFR-6 Web-based — Runs in a browser (no desktop installer, no mobile app).
NFR-7 Performance — Adequate for barangay-hall workloads (≤ a few hundred concurrent sessions; single barangay). Not an evaluated characteristic under the manuscript, but queries must be indexed sensibly.
NFR-8 Data integrity — Resident information centralized; referenced records (households, requests, services, payments, logs) maintain referential consistency; duplicates prevented or flagged; archived (not deleted) records retain history.
NFR-9 Availability/backup — Backup and restore procedures documented and testable in the Release phase; backup history kept.
NFR-10 Scope — ISO/IEC 25010 evaluation restricted to functional suitability, usability, reliability, maintainability. No accounting, no mobile app, no national-government integration, no live SMS.
NFR-11 Locale — Philippine-specific formats: PHP currency, PH dates (`date-fns` with `fil-PH`/PH patterns acceptable), names with Filipino conventions.
