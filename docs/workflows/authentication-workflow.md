# Authentication Workflow

```mermaid
sequenceDiagram
    participant B as Browser
    participant FE as Next.js (middleware + guard)
    participant API as Express API
    participant DB as MongoDB
    B->>FE: GET /dashboard
    FE->>FE: cookie present? else redirect /login
    FE->>API: GET /api/auth/me (credentials: include)
    API->>API: verify JWT (abis_token, httpOnly)
    API->>DB: find user by payload.sub (isActive check)
    DB-->>API: user doc (no passwordHash)
    API-->>FE: { user }
    FE-->>B: render dashboard (or redirect /login on 401)
    B->>API: POST /api/auth/login { username, password }
    API->>API: rate-limit check (20/15min/IP)
    API->>DB: find user +passwordHash
    API->>API: bcrypt.compare + isActive check
    API->>API: sign JWT (12h) -> Set-Cookie abis_token (httpOnly, SameSite=Lax, Secure in prod)
    API->>DB: activityLogs: auth.login
    API-->>B: 200 { user }
    B->>API: POST /api/auth/logout (cookie)
    API->>DB: activityLogs: auth.logout
    API-->>B: clear cookie
```

Security notes: JWT secret from `JWT_SECRET` (≥32 chars enforced in production); password hashed bcrypt (cost 12); account deactivation → all existing tokens rejected on next `/me`/authenticated call (isActive re-checked per request); password change invalidates nothing server-side except `mustChangePassword` flow (documented — stateless JWT invalidation limitation); login failures logged without credentials.
