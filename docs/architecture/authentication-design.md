# ABIS — Authentication & Authorization Design

## Authentication
- Username + password login (manuscript: "username and password").
- Passwords hashed with bcrypt (cost factor 12). Plain text never stored or logged.
- On login: verify credentials + `isActive`; sign JWT (`HS256`, payload `{ sub: userId, role }`,
  expiry `12h`); set as HTTP-only cookie `abis_token` (`HttpOnly`, `SameSite=Lax`, `Secure` in
  prod, `Path=/`, `Max-Age=43200`).
- Logout: clear cookie; activity log `auth.logout`.
- JWT secret from `JWT_SECRET` env var; fail fast if missing in production.
- Rate limit `/api/auth/login` (e.g., 20 req / 15 min / IP) with express-rate-limit.
- `GET /api/auth/me` returns current user profile (no passwordHash).

## Authorization (RBAC)
- Server-side middleware `authenticate` (verify cookie JWT → attach `req.user`) and
  `authorize(...roles)` (403 on mismatch). Frontend also hides disallowed nav items but is NOT
  the security boundary.
- Role permissions per docs/requirements/user-roles.md:
  - `secretary` — full access (admin).
  - `treasurer` — fees/receipts; read-only residents; reports; services view.
  - `captain` — approve/reject certificate requests; read-only residents; dashboard/reports.
  - `resident` — own requests, own profile, own issued docs, correction requests. Only ever
    served their own data: controllers filter by `req.user.residentRef`.
  - `other` — no permissions until barangay assigns (empty by default).

## Session & security details
- Cookie-based sessions only; no token in localStorage (XSS resistance).
- `Helmet` for security headers; CORS allowlist (frontend origin only) with credentials.
- Zod validation on all request bodies/params; sanitized errors; no stack traces in production.
- Activity log on login, logout, failed login (without password), user create/update/
  activate/deactivate/reset, resident/household/request mutations, backup/restore, settings.

## Password reset (Sprint 8)
- Secretary-initiated reset: generates temporary password, forces change on next login (flag
  `mustChangePassword`), logs the action. No email/SMS required (no live SMS).

## Implementation map
- Backend: `middleware/auth.ts`, `middleware/rateLimiter.ts`, `controllers/authController.ts`,
  `services/activityLogService.ts`, `validators/authValidators.ts`.
- Frontend: `app/login/page.tsx`, `middleware.ts` (redirect to /login if no cookie),
  `lib/api.ts` (`credentials: 'include'`), role-aware sidebar.
