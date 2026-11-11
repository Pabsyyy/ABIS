# ABIS — Stakeholder Analysis

Source: manuscript (Population and Locale, Survey respondents, System Architecture roles) and approved master prompt.

## System users (authorized accounts)

| Stakeholder | Count (sampling) | Responsibilities | Information needs | Access requirements | Interacts with |
|---|---|---|---|---|---|
| Barangay Secretary (System Administrator) | ≥1 | Encodes/updates resident & household records; processes and issues certificates; logs/monitors services; generates reports; manages user accounts, activity logs, backups, settings | Full resident/household/request/service/report data and admin functions | Full access (all modules) | All modules; all other roles (as approver of admin changes) |
| Barangay Treasurer | 1 | Records certificate fees and official receipts; views service records | Fees/OR records for certificates; read-only resident data; reports | Fee/receipt endpoints; read-only residents; reports; dashboard | Secretary (receipts reference certificates she issues); Captain (approver) |
| Barangay Captain | 1 | Reviews/approves certificate requests; monitors services | Pending approvals, resident data (read-only), reports, dashboard | Approve/reject endpoints; read-only residents; dashboard/reports | Secretary (approvals gate issuance) |
| Other Authorized Personnel (if approved) | TBD | Assigned functions only | Only what their assignment requires | Zero default permissions until barangay assigns | Secretary (assigns scope) |
| Residents (records + requests at hall) | All barangay residents | Request certificates/services at the Barangay Hall | Their own records/requests handled by staff on their behalf | No login accounts | Secretary (records their data) |

## Non-user stakeholders

| Stakeholder | Interest |
|---|---|
| Household heads (respondents, n=25) | Participate in evaluation; expectations about confidentiality and speed of service |
| Barangay officials and staff (respondents, n=10) | Participate in requirements, alpha/beta use, ISO 25010 evaluation |
| Information Technology experts (n=5) | Evaluate the system technically (ISO/IEC 25010:2011, four characteristics) |
| Punong Barangay (Hon. Ruben Agosto) | Authorizes data handling and encoding; signs turnover; written authorization for encoding resident records |
| Ilocos Sur Polytechnic State College (researchers/adviser) | Development and evaluation of the system per research protocol |
| Future researchers / other barangays | Reference; scope adjustments needed for other locales |

## Remove/replace notes

- Stakeholders must not receive credentials or access beyond their roles. Residents have no accounts (see decisions.md D-14).
- IT experts and officials are not "users" with standing accounts; they may be granted temporary evaluation accounts that are deactivated post-evaluation.
