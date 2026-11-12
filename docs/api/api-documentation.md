# ABIS — API Documentation (outline; grows per sprint)

Base URL: `/api` (dev: `http://localhost:5000/api`). All responses JSON:
`{ success: boolean, data?: any, message?: string, meta?: { page, limit, total } }`.
Auth via HTTP-only cookie `abis_token`.

## Auth
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | /auth/login | public (rate-limited) | Login `{username, password, remember?: boolean}`; sets cookie (30-day when remember=true, session otherwise) |
| POST | /auth/logout | any auth | Logout; clears cookie |
| GET | /auth/me | any auth | Current user |

## Users (admin)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | /users | secretary | List users (paginated, filter by role/status) |
| POST | /users | secretary | Create user (username, fullName, password, role, residentRef?) |
| GET | /users/:id | secretary | User detail |
| PATCH | /users/:id | secretary | Update name/role/active flag/residentRef |
| POST | /users/:id/reset-password | secretary | Set temporary password |

## Residents (Sprint 2)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | /residents | secretary, treasurer(RO), captain(RO) | Search/filter/paginate |
| POST | /residents | secretary | Create (duplicate check) |
| GET | /residents/:id | all staff; resident=own only | Detail + household + history refs |
| PATCH | /residents/:id | secretary | Update |
| POST | /residents/:id/archive | secretary | Archive (soft delete) |
| POST | /residents/:id/restore | secretary | Restore |
| GET | /residents/export | secretary | Excel export |
| POST | /residents/import | secretary | Excel import with validation report |
| GET | /classifications | any auth | Classification list |

## Households (Sprint 3)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET/POST | /households | secretary (RO: treasurer, captain) | List/create |
| GET/PATCH | /households/:id | secretary (RO others) | Detail/update |
| POST | /households/:id/members | secretary | Add/transfer member |
| DELETE | /households/:id/members/:residentId | secretary | Remove member |

## Certificate requests & issuance (Sprints 4–5)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET/POST | /certificate-types | secretary manage; others read | Type CRUD |
| GET/POST | /certificate-requests | resident=own/staff; secretary all | List/create |
| GET | /certificate-requests/:id | owner/staff | Detail |
| POST | /certificate-requests/:id/approve | captain, secretary | Approve |
| POST | /certificate-requests/:id/reject | captain, secretary | Reject w/ reason |
| POST | /certificate-requests/:id/issue | secretary | Generate PDF, assign control no. |
| POST | /certificate-requests/:id/release | secretary | Mark released |
| GET | /issued-certificates | secretary, treasurer, captain | History/search |
| POST | /payments | secretary, treasurer | Record fee/OR no./status |

## Services (Sprint 6)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET/POST | /service-categories | secretary manage | Category CRUD |
| GET/POST | /service-records | secretary (RO reports) | List/create |
| GET | /service-records/:id | staff | Detail |

## Dashboard & reports (Sprint 7)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | /dashboard/summary | staff | Live totals + distributions |
| GET | /reports/:type | staff | generateJSON with filters (date range, purok, classification) |
| GET | /reports/:type/export | staff | `?format=pdf|xlsx` |

## Administration (Sprint 8)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | /activity-logs | secretary | Log viewer (filterable) |
| GET/PATCH | /settings | secretary | get/update singleton settings |
| POST | /backup | secretary | Create backup (log entry) |
| GET | /backup/logs | secretary | Backup history |
| POST | /backup/restore | secretary | Restore (confirm + password) |
| GET | /notifications | any auth | Own notifications |
| POST | /sms/send | — | DISABLED (placeholder; always returns "SMS disabled") |

## Error format
`{ success:false, message:"...", errors?: [{ field, message }] }` with proper 4xx/5xx codes.
