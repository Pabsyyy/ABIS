# ABIS — Project Overview

**Project Title:** ABIS: Development and Evaluation of an Online Barangay Information System with Resident Profiling and Data-Driven Governance for Ambucao, Santiago, Ilocos Sur

**Project Location:** Barangay Ambucao, Santiago, Ilocos Sur, Philippines

**Project basis:** Research proposal `Research_Proposal_kitan_u_mannu_usto.docx` (Ilocos Sur Polytechnic State College, CS 404 Project Study 1). The research manuscript is the primary source of approved requirements.

## Objective

Develop a centralized, web-based Integrated Barangay Information System that helps authorized barangay officials and staff manage:

1. Resident Profiling
2. Household Management
3. Certificate and Document Issuance
4. Service Monitoring and Recording
5. Dashboard and Reports
6. User and System Administration

## Current manual situation (from manuscript)

Barangay Ambucao keeps resident and household records in paper logbooks and filing cabinets. Challenges: disorganized records, slow manual retrieval, duplicates, fading/lost documents, manual certificate preparation, re-encoding of resident data for every request, reports compiled manually, no backup, no access control on sensitive records.

## Expected benefits (from manuscript)

- Centralized database; encode once, reuse everywhere
- Faster certificate issuance and service delivery
- Improved accuracy; reduced duplication and errors
- Data-driven governance via accurate, printable reports
- Role-based security and backup/restore for records continuity
- Compliance with the Data Privacy Act of 2012 (RA 10173)

## Development approach

Agile (Scrum) per the manuscript: Initiation → Planning & Estimation → Sprint Development → Review & Retrospective → Release. Evaluation by ISO/IEC 25010:2011 (functional suitability, usability, reliability, maintainability) administered to intended users and IT experts.

## Non-goals

No resident portal/login, no mobile app, no full accounting system, no national-government integration, no live SMS (placeholder only), no AI features. See `system-scope.md`.

## Key decisions

Tracked in `docs/architecture/decisions.md`. Notably: MongoDB instead of manuscript's MySQL (approved); residents are NOT login accounts (approved master prompt rule — overrides manuscript's limited Resident account; see decisions.md D-2/D-14).
