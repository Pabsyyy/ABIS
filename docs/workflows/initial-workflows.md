# ABIS — Initial Workflows

High-level workflows. Low-level/UX details refined in sprints. Resident accounts do not exist (decisions.md D-14); all requests are processed at the Barangay Hall by authorized personnel.

## WF-1 Resident encoding (Secretary)
1. Secretary → Residents → Add Resident.
2. System checks duplicates (name + birthdate). On match: warn and offer link to existing record; do not create silently.
3. Secretary encodes resident details. Saved; activity log `resident.create`.

## WF-2 Certificate request and issuance
1. Resident visits the Barangay Hall.
2. Secretary → Certificates → New Request; searches resident (auto-fill); selects certificate type + purpose; submits. Status: `pending`.
3. Captain reviews and approves/rejects (if approval applies — open item D-9). Secretary is notified.
4. On approval, Secretary → Issue: control number assigned; PDF generated (letterhead); printed.
5. Treasurer/Secretary records fee: amount, OR number, payment status (`paid|unpaid|waived`). OR tied to the certificate transaction only.
6. Certificate released at hall; release recorded (`releasedAt`, `releasedTo`). History updated; activity log entry.

## WF-3 Fee and receipt recording (Treasurer)
1. Treasurer opens the issued-certificate record.
2. Records amount + OR number; sets payment status. Saved; log `payment.record`.

## WF-4 Service monitoring (Secretary)
1. Secretary → Services → Add Service Record.
2. Search resident, choose category + date, enter description + beneficiary info if required. Saved; log `service.create`.

## WF-5 Reports (Secretary/Treasurer/Captain — read)
1. Choose report + filters (date range, purok, classification).
2. Live DB aggregation; results rendered as tables/charts; export Excel/PDF or print; filters re-applied server-side.

## WF-6 User administration (Secretary)
1. Secretary → Settings → Users → Create User (username, full name, temporary password, role).
2. Password hashed; forced change on first login; log `user.create`.
3. Deactivation preferred over deletion; reset password sets temporary password + force-change flag.

## WF-7 Backup and restore (Secretary)
1. Settings → Backup → Create Backup: all collections exported to a timestamped JSON file; `backupLogs` entry (success/failure, size).
2. Restore requires typed confirmation + re-entering password; restore replaces all collections from the chosen file; logged `backup.restore`.

## WF-8 Notifications
1. Captain account gains unread notification when a request is submitted for approval.
2. Reading the notification marks it read; badge clears.
