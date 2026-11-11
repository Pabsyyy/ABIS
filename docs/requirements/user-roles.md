# ABIS — User Roles and Permissions

Four account types are defined by the manuscript (Figure 4, System Architecture section). A fifth,
"Other Authorized Personnel", comes from the development master prompt and needs barangay approval
before it is used. Residents exist both as records (`residents` collection) and, optionally, as
limited login accounts (see decisions.md, D-2).

## Permission matrix (manuscript-derived)

| Capability | Resident | Secretary | Treasurer | Captain | Other (if approved) |
|---|---|---|---|---|---|
| Log in / log out | Yes (limited) | Yes | Yes | Yes | Yes |
| Submit certificate/document request | Yes (own) | Yes (on behalf) | No | No | Assigned only |
| Track request status | Own only | All | All (view) | All (review) | Assigned only |
| View own resident profile | Yes (own) | Yes (all) | Read-only | Read-only | Assigned only |
| View other residents' records | No | Yes | Read-only | Read-only | Assigned only |
| Add/edit resident records | No | Yes | No | No | No |
| Archive/restore resident records | No | Yes | No | No | No |
| Encode/edit household records | No | Yes | No | No | No |
| Process/issue certificates | No (request only) | Yes | No | Approve/reject | No |
| Record certificate fees / receipts | No | Yes | Yes | No | No |
| Log/monitor service records | No | Yes | View | View/monitor | Assigned only |
| View dashboard | No | Yes | Yes | Yes | Assigned only |
| Generate/export reports | No | Yes | Yes | Yes | Assigned only |
| Manage user accounts | No | Yes | No | No | No |
| View activity logs | No | Yes | No | No | No |
| Database backup/restore | No | Yes | No | No | No |
| System settings | No | Yes | No | No | No |
| Request correction of own record | Yes | No (applies corrections) | No | No | No |

## Role definitions

### Resident (limited, self-service)
- Submit certificate and document requests; track own request status.
- View own profile, own issued documents; request correction of own record.
- Cannot open other residents' records, reports, or user accounts.
- Cannot issue certificates or edit any record.

### Barangay Secretary (system administrator)
- Full access, including: resident & household records (encode/update/search/archive), certificate
  processing and issuance, service logging/monitoring, reports, user accounts, activity logs,
  database backups, system settings.

### Barangay Treasurer
- Records fee payments for issued certificates (amount, official receipt number, payment status).
- Views: service records, resident records (read-only), reports, dashboard.
- Cannot: encode/edit resident records, issue certificates, manage user accounts.

### Barangay Captain
- Reviews/approves (or rejects) certificate requests and clearances.
- Views: resident records (read-only), dashboard, reports; monitors barangay services.
- Cannot: encode/edit records, manage user accounts, record fees.

### Other Authorized Personnel (master prompt; NOT in manuscript)
- Only accounts approved by the barangay; access limited to assigned functions.
- Exact permission set must be defined by the barangay before such an account is created.

## Unknowns to confirm with the barangay (do NOT invent)

- Whether the Captain's approval applies to all certificate types or only specific ones.
- Whether the Treasurer may also log service-related assistance disbursements.
- Whether any "Other Authorized Personnel" accounts are needed and what they may do.
- Whether Resident self-service accounts are wanted in production (manuscript defines them; the
  master prompt did not; see decisions.md D-2).
- Official receipt numbering scheme for the Treasurer's fee recording.
