# SYS ERP — Production Readiness Audit

## Scope and evidence

This follow-up continued the existing audit. It used the current worktree, module implementations, and isolated automated tests. It did not connect to the configured local MongoDB because the existing smoke script creates persistent ERP records and the database has not been identified as disposable.

The configured Render API was probed without authentication or data mutation:

- First health request timed out; a retry returned HTTP 200 with `{"status":"ok"}`.
- That response is from the currently deployed version: it does not include the database status exposed by the current local source.
- This proves the hostname responds, not that the current code is deployed or that production MongoDB persistence works.

## Findings

| Area | Status | Evidence and remaining work |
|---|---|---|
| Backend runtime | PARCIAL | Express mounts the modules; source `/health` now reports MongoDB readiness with 200/503. Render host responded after a timeout, but with the previous health payload. |
| MongoDB | BLOQUEADO EXTERNO | A local `MONGO_URI` is configured, but its value was not read or used. Production Atlas connection/persistence was not verified. |
| Auth | PARCIAL | Login, invalid credentials, refresh, and platform company-context switch are unit-tested. Native tokens now use SecureStore. Refresh tokens are not server-side revocable, and persistence has not been exercised on a physical iPhone. |
| RBAC | PARCIAL | Tests cover permissions and tenant denial of company/role administration. Real role records and endpoint behavior remain to verify against a disposable DB. |
| Multi-tenancy | PARCIAL | JWT company context overrides caller-supplied company IDs; service tests confirm tenant-scoped reads/writes and movement rejection across companies. No live two-company integration test was run. |
| Products | PARCIAL | Service tests cover listing, SKU conflict, safe creation, update scoping, and soft deactivation. No live Mongo CRUD run; the existing SKU index remains globally unique. |
| Users | PARCIAL | Tests cover password hashing, credential-field allowlisting, tenant assignment, self-disable protection, soft disable, and JSON hash exclusion. No live Mongo CRUD run. |
| Inventory | PARCIAL | Isolated transaction tests verify +10, -4, +4, insufficient stock and rollback behavior. Product stock remains the existing company-wide counter, not per-warehouse stock. |
| Movements | PARCIAL | Movement records now capture company/user and before/after stock; adjustment and one-time compensating reversal are tested. MongoDB replica-set transaction behavior remains unverified. |
| Audit | PARCIAL | Middleware test verifies actor/tenant/entity attribution, redaction, and skips auth/failed requests. Persistence against production MongoDB remains unverified. |
| Mobile UI | PARCIAL | Product/user soft-disable actions, confirmation/success feedback, movement adjustment/reversal/history and refresh are wired. Expo web export passed; no simulator or device interaction test was performed. |
| iOS | PARCIAL | iOS JS export passed; app name/scheme and existing bundle ID are configured; production EAS API URL and build profiles exist. No signed IPA/device install. Final icon/splash artwork is absent. |
| Production deployment | PARCIAL | Render Blueprint points at the public API and now restricts production CORS to the web frontend. Current Render plan is `free` and can sleep; local uncommitted changes have not been deployed. |

## Corrections made

- Product create/update uses explicit allowlists, opening stock must be zero, legacy products without `isActive` remain visible, and delete is a soft deactivation.
- User create/update uses explicit allowlists, hashes passwords, prevents company admins assigning platform permissions, and deactivation is soft and tenant-scoped.
- Stock movement operations append audit snapshots and update stock in a MongoDB transaction; signed adjustments and one-time reversal are supported.
- Purchase receiving and sales confirmation record the actor/company and stock snapshots; stock updates verify matched records.
- Successful mutation auditing now excludes `/api/v1/auth/*` and reports persistence errors.
- Health status now reflects Mongoose connection readiness.
- Native auth session persistence uses Expo SecureStore; web retains AsyncStorage. Persistence failures are surfaced.
- Production EAS and Render builds use the public HTTPS API URL; local `.env` remains a local-development setting.

## Remaining risks

- The checked-in product schema declares SKU globally unique; changing that to per-company uniqueness would require a verified data/index migration and was not guessed.
- Refresh token replacement is client-side only; the backend does not track/revoke previously issued refresh tokens.
- Render is configured on the free plan, which may sleep; always-on service requires a paid-plan decision.
- A real MongoDB transaction and API CRUD smoke test must use a disposable test database. The provided smoke script is not safe to run against an unidentified database because it creates persistent records.
- No final branding assets exist at the project root for an app icon or splash image.
