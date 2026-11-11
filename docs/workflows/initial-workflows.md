# ABIS — Initial Workflows

High-level workflows as derived from the manuscript. Low-level/UX details refined in sprints.

## WF-1 Resident encoding (Secretary)
1. Secretary opens Residents → Add Resident.
2. System checks for duplicates (name + birthdate). If a match exists, warn and link instead of
   creating a duplicate.
3. Secretary encodes resident details (personal + demographic + classification + purok/address).
4. System saves; activity log entry created (`resident.create`).

## WF-2 Certificate request and issuance (per manuscript roles)
1. Resident visits Barangay Hall (or a request is encoded on their behalf by the Secretary).
2. Requestor selects resident from directory (search); resident info auto-fills (no re-encoding).
3. Select certificate type + purpose; submit. Status: `pending`.
4. Captain reviews and approves/rejects (if approval applies to that type — see open questions).
5. Secretary generates certificate: control number assigned, PDF produced, printed with letterhead.
6. Fee recorded by Treasurer or Secretary: amount, OR number; payment status.
7. Certificate released to resident; release recorded. Request history updated; log entry created.

## WF-3 Fee and receipt recording (Treasurer)
1. Treasurer opens issued-certificate record (read access).
2. Records fee amount + OR number; marks payment status (`paid`/`unpaid`/`waived`).
3. System stores payment linked to the certificate (not a general ledger); log entry created.

## WF-4 Service monitoring (Secretary)
1. Secretary opens Services → Add Service Record.
2. Selects resident (search), service category, date, description, beneficiary info if required.
3. Service record saved; appears in service history and summaries.

## WF-5 Reports (Secretary/Treasurer/Captain — read)
1. User opens Reports, picks report type + filters (date range, purok, classification).
2. System queries DB (no hardcoded figures); renders tables/charts.
3. Export to PDF / Excel / print layout as needed; log entry optional for exports.

## WF-6 User administration (Secretary)
1. Secretary opens Settings → Users → Create User.
2. Sets name, username, temporary password, role (Secretary/Treasurer/Captain/Resident/Other).
3. System hashes password; account active; log entry created.
4. Deactivation instead of deletion preserves audit trail; password reset issues new temporary password.

## WF-7 Backup and restore (Secretary)
1. Secretary opens Settings → Backup → Create Backup.
2. System dumps MongoDB collections to a timestamped file; records backupLogs entry.
3. Restore requires explicit confirmation + password; restore logged.

## WF-8 Resident correction request (Resident role)
1. Resident logs in, views own profile, submits correction request (field + proposed correction).
2. Secretary reviews; applies correction via normal edit flow; log entry created.
