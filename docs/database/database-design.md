# ABIS — Database Design (MongoDB)

Conventions: `_id` ObjectId; `createdAt`/`updatedAt` via Mongoose timestamps; references store
ObjectIds; statuses are string enums; avoid duplicating resident personal data — reference
`residents._id` everywhere else.

## Collections

### users
- `username` (unique, required, lowercase, index), `passwordHash` (required, select:false),
  `fullName` (required), `role` (enum: `resident|secretary|treasurer|captain|other`, required,
  index), `residentRef` (ref residents, required when role=`resident`), `isActive` (bool,
  default true), `lastLoginAt` (Date), `createdBy` (ref users).
- Indexes: `{ username: 1 } unique`, `{ role: 1 }`, `{ isActive: 1 }`.

### residents
- `firstName` (req), `middleName`, `lastName` (req), `suffix`, `birthdate` (req, Date),
  `sex` (enum M/F), `civilStatus` (enum: single, married, widowed, separated, annulled,
  divorced), `purok` (ref puroks or string), `address`, `contactNumber`, `email`,
  `occupation`, `monthlyIncome` (Number, optional), `classifications` [String enum keys],
  `isHouseholdHead` (bool), `householdRef` (ref households, nullable), `status` (enum:
  `active|archived`, default `active`, index), `archivedAt`, `notes`.
- Duplicate prevention: compound index `{ lastName:1, firstName:1, birthdate:1 }` (non-unique)
  + application-level fuzzy match on create/update; import reports duplicates.
- Indexes: `{ lastName:1, firstName:1 }`, `{ purok:1 }`, `{ status:1 }`, `{ classifications:1 }`.
- Validation: names trimmed/non-empty; birthdate in past; contact matches PH pattern if provided.

### households
- `householdNumber` (String, unique, required), `headResident` (ref residents, required),
  `purok` (ref puroks/string), `address`, `members` [ref residents], `status`
  (`active|archived`), `notes`.
- Indexes: `{ householdNumber:1 } unique`, `{ headResident:1 }`, `{ purok:1 }`.

### puroks
- `name` (String, unique, required, e.g., "Purok 1"), `description`, `isActive` (bool).
- Seeded empty until barangay supplies list.

### classifications
- `key` (unique, e.g., `senior_citizen`), `label` (e.g., "Senior Citizen"), `description`,
  `isActive`. Admin-managed. Interim seed: senior_citizen, pwd, solo_parent, four_ps,
  indigenous_people, youth (15-30), voter, below_poverty_line. Confirm keys with barangay.

### certificateTypes
- `name` (unique, required), `description`, `fee` (Number, default 0), `requiresApproval`
  (bool, default true), `active` (bool, default true), `templateKey` (String).
- Interim seed (D-3): Barangay Clearance, Certificate of Residency, Certificate of Indigency,
  Certificate of Business Clearance, Certificate of Good Moral Character, Barangay ID, Cedula,
  Indigency for Assistance. Fees TBD by barangay.

### certificateRequests
- `resident` (ref residents, required, index), `certificateType` (ref certificateTypes, req),
  `purpose` (String, req), `status` (enum: `pending|approved|rejected|issued|ready_for_release|released|cancelled`, index),
  `controlNumber` (String, unique sparse), `requestedBy` (ref users), `approvedBy` (ref users),
  `approvedAt`, `rejectionReason`, `issuedCertificate` (ref issuedCertificates), `notes`.
- Indexes: `{ resident:1, createdAt:-1 }`, `{ status:1 }`, `{ controlNumber:1 } unique sparse`.

### issuedCertificates
- `request` (ref certificateRequests, unique), `resident` (ref residents, index),
  `certificateType` (ref certificateTypes), `controlNumber` (unique), `issuedBy` (ref users),
  `issuedAt`, `releasedAt`, `releasedTo` (String), `orNumber` (String), `fee` (Number),
  `paymentStatus` (enum: `unpaid|paid|waived`).

### payments
- `issuedCertificate` (ref, required), `resident` (ref residents, index), `amount` (Number,
  required, min 0), `orNumber` (String), `paymentStatus` (enum same as above), `recordedBy`
  (ref users), `recordedAt`. (Certificate-fee recording only; not a general ledger.)

### serviceCategories
- `name` (unique), `description`, `isActive`. Interim seed (confirm): Medical Assistance,
  Financial Assistance, Burial Assistance, Livelihood/Livelihood Program, Feeding Program,
  Senior Citizen Benefits, PWD Benefits, Solo Parent Assistance, 4Ps Monitoring, Disaster/Calamity
  Assistance, Indigency Endorsement, Other.

### serviceRecords
- `resident` (ref residents, required, index), `category` (ref serviceCategories, req),
  `serviceDate` (Date, req), `description` (String, req), `beneficiaryInfo` (String, optional),
  `recordedBy` (ref users), `notes`.
- Indexes: `{ resident:1, serviceDate:-1 }`, `{ category:1 }`, `{ serviceDate:-1 }`.

### activityLogs
- `user` (ref users), `action` (String, e.g., `auth.login`, `resident.create`, index),
  `targetType`, `targetId`, `details` (Mixed, NO secrets), `ip`, `createdAt`.
- Indexes: `{ createdAt:-1 }`, `{ user:1, createdAt:-1 }`, `{ action:1 }`.

### notifications
- `user` (ref users, index), `title`, `message`, `type` (enum: info|approval|alert),
  `read` (bool, default false), `createdAt`, `link` (String, optional).

### smsLogs
- PLACEHOLDER. `recipient`, `message`, `status` (enum: `disabled|queued|sent|failed`; default
  `disabled`), `error`, `createdAt`. No sending implementation.

### systemSettings
- Singleton (`key: 'barangay'`): `barangayName`, `municipality`, `province`, `captainName`,
  `contactNumber`, `letterhead` (logo path/text), `controlNumberScheme` (default
  `ABIS-YYYY-00000`), `smsEnabled` (default false).

### backupLogs
- `filename`, `path`, `sizeBytes`, `createdBy` (ref users), `createdAt`, `status`
  (`success|failed`), `type` (`full|collection`), `error`.

## Relationship summary

```
users.residentRef ─────────► residents ◄── certificateRequests.resident ──► certificateTypes
households.headResident ───► residents      issuedCertificates.resident          │
households.members ─────────► residents      payments.resident                  ▼
serviceRecords.resident ────► residents   serviceCategories ◄── serviceRecords   payments.issuedCertificate ──► issuedCertificates
activityLogs.user ──────────► users       notifications.user ──► users     issuedCertificates.request ──► certificateRequests
```

## Design rules

- Resident PII stored once in `residents`; everything else references it.
- Secrets never stored (`passwordHash` select:false; never logged).
- Deletion policy: archive (status='archived') for residents/households; hard delete only for
  test data; users deactivated, not deleted.
- All monetary fields are Numbers in PHP (Philippine pesos), min 0.
