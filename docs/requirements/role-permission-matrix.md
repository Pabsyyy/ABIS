# ABIS — Role Permission Matrix

Backend-enforced via `authorize(...roles)` middleware; frontend mirrors for UX (hiding ≠ security). Roles: `secretary`, `treasurer`, `captain`, `other`. `other` = zero default permissions. No resident login role.

Legend: W = write, R = read, — = none.

| Endpoint/Area | Secretary | Treasurer | Captain | Other |
|---|---|---|---|---|
| /api/auth/login, /logout, /me | W | W | W | W |
| /api/users (list/create/update/reset) | W | — | — | — |
| /api/residents (GET list/detail) | R | R | R | — |
| /api/residents (POST/PATCH/archive/restore/import/export) | W | — | — | — |
| /api/classifications (GET) | R | R | R | — |
| /api/households (GET list/detail) | R | R | R | — |
| /api/households (POST/PATCH/members) | W | — | — | — |
| /api/certificate-types (GET) | R | R | R | — |
| /api/certificate-types (POST/PATCH) | W | — | — | — |
| /api/certificate-requests (GET list/detail) | R | R | R | — |
| /api/certificate-requests (POST/issue/release/cancel) | W | — | — | — |
| /api/certificate-requests/:id/approve /reject | W | — | W | — |
| /api/issued-certificates (GET, print PDF) | R | R | R | — |
| /api/payments (POST) | W | W | — | — |
| /api/payments (GET) | R | R | R | — |
| /api/service-categories (GET) | R | R | R | — |
| /api/service-categories (POST/PATCH) | W | — | — | — |
| /api/service-records (GET) | R | R | R | — |
| /api/service-records (POST/PATCH) | W | — | — | — |
| /api/dashboard/summary | R | R | R | — |
| /api/reports/* (GET + export) | R | R | R | — |
| /api/activity-logs (GET) | R | — | — | — |
| /api/settings (GET/PATCH) | W | — | — | — |
| /api/backup (POST/restore) | W | — | — | — |
| /api/backup/logs (GET) | R | — | — | — |
| /api/notifications (own) | R/W own | R/W own | R/W own | R/W own |
| /api/sms/send | stub only | stub only | stub only | stub only |

Notable rules: secrets never logged; `users` caches no passwords; deactivated users → 401 on every authenticated call.
