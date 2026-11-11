# ABIS — User Roles and Permissions

Approved roles per the master prompt: **Barangay Secretary** (administrator), **Barangay Treasurer**, **Barangay Captain**, **Other Authorized Personnel** (only if approved; zero default permissions). Residents are **not** login accounts (see decisions.md D-14).

Legend: ✅ full, 👁 read-only, — none.

| Capability | Secretary | Treasurer | Captain | Other |
|---|---|---|---|---|
| Login / logout | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ | — |
| Residents: list/search/filter/export | ✅ | 👁 | 👁 | — |
| Residents: create/edit/archive/restore | ✅ | — | — | — |
| Residents: Excel import | ✅ | — | — | — |
| Households: list/search/details | ✅ | 👁 | 👁 | — |
| Households: create/edit/members/transfer | ✅ | — | — | — |
| Certificate types: manage | ✅ | — | — | — |
| Certificate types: read | ✅ | ✅ | ✅ | — |
| Certificate requests: list/details | ✅ | 👁 | ✅ | — |
| Certificate requests: create/process/issue/release | ✅ | — | — | — |
| Certificate requests: approve/reject | ✅ | — | ✅ | — |
| Fee recording (amount, OR number, status) | ✅ | ✅ | — | — |
| Issued certificates: list/view/print | ✅ | ✅ | ✅ | — |
| Services: list/search/details | ✅ | ✅ | ✅ | — |
| Services: create/edit | ✅ | — | — | — |
| Service categories: manage | ✅ | — | — | — |
| Reports: view/print | ✅ | ✅ | ✅ | — |
| Reports: export (Excel/PDF) | ✅ | ✅ | ✅ | — |
| Activity logs: view | ✅ | — | — | — |
| System settings | ✅ | — | — | — |
| Backup / restore | ✅ | — | — | — |
| Users: manage | ✅ | — | — | — |
| Notifications: own inbox | ✅ | ✅ | ✅ | ✅ |

## Role definitions

### Barangay Secretary (system administrator)
Full access including residents/households CRUD, certificate processing/issuance, fee recording, service logging, reports, users, logs, settings, backups.

### Barangay Treasurer
Records certificate-related fees and official receipts; views residents read-only; views services; views/exports reports and dashboard. Cannot encode or edit resident/household records, issue certificates, approve requests, manage users, view logs, change settings, or back up.

### Barangay Captain
Approves/rejects certificate requests; views residents read-only; views dashboard and reports; views service records. Cannot edit records, record fees, issue certificates, manage users, view logs, change settings, or back up.

### Other Authorized Personnel
May receive accounts only if approved by the barangay. Zero default permissions; access explicitly assigned by the Secretary (not yet defined — see decisions.md D-7).

## Not in scope

Resident accounts/login (residents are records processed at the Barangay Hall; see decisions.md D-14). Account deletion (deactivation preferred, preserving audit trail).
