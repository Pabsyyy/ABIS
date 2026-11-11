# ABIS — UI/UX Specification

Design system: Tailwind + approved palette (primary #0B2A4A, secondary #082544, accent #1469D4 / #1677E8, background #F5F9FD, light #EAF4FF, white #FFFFFF, text #163B63, muted #64748B, border #D9E6F2, success #16A765, warning #F59E0B). shadcn/ui-style components (Button, Input, Select, Card, Dialog, Table). Lucide icons. GSAP limited to: login card entrance, dashboard card stagger, sidebar slide, modal entrance — never >300ms, never blocking.

Shell (all authenticated pages): fixed left sidebar (w-64, role-aware nav) + top bar (breadcrumb, barangay name, notification badge) + content area (max-w-7xl, p-6). Desktop-first; tablet-safe (sidebar collapsible to icons ≤1024px; content stacks ≤768px). No separate mobile app.

Per-page definition:

**Login** — Centered card on navy background; resident-hall disclaimer; username + password (show/hide toggle); client validation (Zod) + server errors shown inline; rate-limit message on 429; loading state on submit.

**Dashboard** — Stat cards row (residents, households, pending approvals, issued this month) + Recharts: sex distribution (donut), age groups (bar), purok distribution (bar), request trend (area). Quick links to modules. Loading skeletons; empty state ("No residents yet" with CTA to add).

**Resident Management** — TanStack Table: name, age/sex, purok, classifications, household, status badge. Global search + column filters (purok, classification, status); sortable columns; pagination (10/25/50). Header actions: Add Resident (modal/drawer), Import (Excel), Export, Archive view toggle. Add/Edit modal with RHF+Zod: personal info section, classification checkboxes, purok dropdown, contact; duplicate warning inline. Detail drawer: profile, classifications, household link, service/certificate history (Sprints 4–6). Confirm dialogs on archive/restore. Empty/error states.

**Household Management** — Same pattern: cards/table of households (number, head, purok, member count). Create modal: household number (auto-suggest HH-####), head (resident search-select), purok, address. Detail drawer: members list with roles, add/transfer member, composition stats.

**Certificate Management** — Tabs: Requests (list + status filter + approve/reject) | Certificate Types (Secretary grid with add/edit) | Issued (search, print PDF). New Request: step-like single page — search resident → auto-filled profile card → type select (fee shown) → purpose → submit. Approve/reject: confirmation modal with reason field for reject. Issued detail: control number, OR link, payment badge, print/download buttons.

**Service Monitoring** — List w/ category + date filters + search; Add Service modal (resident search, category select, date picker, description, beneficiary). Detail + per-resident history tab on resident detail. Summary cards (this month count by category).

**Reports** — Left panel: report type select + filters (date range, purok, classification) + format buttons (View, Excel, PDF, Print). Results: summary stat strip + data table + chart where meaningful. Print CSS: hides chrome, letterhead header.

**User Management** (done) — List + create form (Secretary only); activate/deactivate toggle; reset password w/ temporary-password prompt.

**Settings** — Barangay profile (name, captain, municipality, contact, control-number scheme), Change my password, SMS toggle (disabled, labeled placeholder), Backup now + history, Restore (typed confirmation + password).

**Logs** — Filterable table (user, action, date range), secretary-only.

All pages: consistent header (h1 + description + actions), breadcrumb, toast on success/error, loading skeletons, empty states, error states with retry, confirmation dialogs for destructive actions.
