# System Workflow — Barangay Hall Operations

```mermaid
flowchart TD
    subgraph Hall["Barangay Hall (authorized personnel only)"]
        A[Resident approaches counter] --> B{Secretary logs in}
        B --> C[Search resident or register new]
        C --> D[System auto-fills resident data]
        D --> E{Transaction}
        E -->|Certificate request| F[Select type + purpose]
        F --> G[Status: pending]
        G --> H[Captain reviews]
        H -->|Approve| I[Secretary issues: control number + PDF]
        H -->|Reject| J[Rejection reason recorded]
        I --> K[Treasurer records fee + OR number]
        K --> L[Certificate released + logged]
        E -->|Service assistance| M[New Service Record + category]
        M --> N[Stored; appears in summaries/reports]
        E -->|Information update| O[Edit resident/household]
        E -->|Report request| P[Pick report + filters; PDF/Excel/print]
    end
    subgraph Audit["Everywhere"]
        Q[Activity logs: who did what] --> R[Secretary reviews logs]
        S[Backup job] --> T[backupLogs + JSON file]
    end
```

Key flows: resident data encoded once (central), reused by all modules, R1; every mutation logged, R2; residents have no accounts, R3 (D-14); Treasurer cannot edit residents, R4; Captain gatekeeps certificates, R5; Secretary administers accounts/settings/backup, R6.
