# ABIS — Acceptance Criteria

Testable pass/fail criteria per module. Verification evidence recorded in `docs/testing/`.

## Foundation & Auth (S1)
- AC-1.1 App boots with zero console errors (`npm run dev`); root `/` redirects to `/dashboard` → unauthenticated users land on `/login`.
- AC-1.2 Valid credentials → 200 + `abis_token` cookie (HttpOnly); invalid → 401 with generic message; 21st rapid login → 429.
- AC-1.3 Banned/deactivated account → 403 on login, 401 on any /me call.
- AC-1.4 Treasurer calls POST /api/users → 403; unauthenticated call → 401; Secretary → 200/201.
- AC-1.5 Production cookie has Secure flag; JWT not readable from JS (`document.cookie` empty for token).
- AC-1.6 Helmet headers present (x-content-type-options, x-frame-options, ...); no x-powered-by.

## Residents (S2)
- AC-2.1 Create resident → stored, log entry; duplicate name+birthdate → 409/warning, not silent create.
- AC-2.2 Search "juan" matches by first/last; filter by purok/classification; pagination returns meta.total.
- AC-2.3 Edit updates only provided fields; archived resident hidden from default list; restore works.
- AC-2.4 Export Excel → file opens with header + rows; Import valid file → N created, 0 errors; Import with bad row → error report listing row + reason.
- AC-2.5 Birthdate in future rejected (400); empty name rejected; invalid contact rejected.

## Households (S3)
- AC-3.1 Create household with auto/unique number; duplicate number → 409.
- AC-3.2 Add member (existing resident) → resident.householdRef set; member appears in detail; same resident cannot be added twice.
- AC-3.3 Transfer member household A→B → resident.householdRef updated; counts update on both.
- AC-3.4 Head resident must exist (400 otherwise).

## Certificate Requests (S4)
- AC-4.1 New request with valid resident auto-fills profile; submission → 201 status=pending.
- AC-4.2 Treasurer POST request → 403. Captain approve → status=approved, log; reject requires reason; invalid transition (issue before approve) → 409.
- AC-4.3 Control number assigned at issue; unique; matches settings scheme.

## Certificate Generation & Fees (S5)
- AC-5.1 Issue → PDF downloads; content includes barangay letterhead (settings), resident name, type, control number.
- AC-5.2 Fee record: amount>0 required (or explicit waived); OR number stored; payment status enum enforced; record linked to issued cert.
- AC-5.3 Issued list printable; releasedAt/releasedTo recorded at release.

## Services (S6)
- AC-6.1 Add service → appears in list; per-resident history shows it; invalid category → 400.
- AC-6.2 Filter by category + date range works; summaries count only matching records.

## Dashboard & Reports (S7)
- AC-7.1 Dashboard totals equal DB counts (spot-checked via Mongo query during test).
- AC-7.2 Report with date filter returns only in-range rows; purok filter correct; PDF/Excel exports contain the same filtered rows.
- AC-7.3 Print CSS removes chrome; letterhead on print view.

## Administration (S8)
- AC-8.1 Activity log viewer: filters by user/action; entries exist for login + all module mutations.
- AC-8.2 Settings persist (singleton) and affect PDF letterhead + control-number scheme.
- AC-8.3 Backup → file in backups/ + backupLogs entry; Restore requires typed confirmation + correct password; restored DB contains pre-backup users/residents.
- AC-8.4 Other role → every endpoint 403 except auth/me + notifications own.

## Integration (S9)
- AC-9.1 No dead-end pages; resident detail links households/requests/issued/services; charts match tables; no console errors on any page.

Tests never claim pass without execution; see docs/testing/ for actual results.
