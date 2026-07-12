# Backend Architecture

## Goals

The backend is a modular Express application. Feature code is grouped by business capability, while reusable HTTP infrastructure lives under `common`.

## Runtime flow

```text
HTTP request
  -> global security and parsing middleware
  -> API prefix (/api/v1)
  -> central route registry
  -> feature router
  -> validation middleware (when endpoints are added)
  -> controller
  -> service
  -> Mongoose model / aggregation
  -> standard API response
  -> centralized error middleware on failure
```

## Directory map

```text
server/
  src/
    common/
      errors/        application error types
      middleware/    validation, 404, and error middleware
      utils/         async wrapper and response envelope
    config/          validated environment configuration
    modules/         isolated business capabilities
    routes/          central feature route registration
    app.js            Express composition without network binding
    server.js         process lifecycle and network binding
  test/               backend integration tests
```

## Feature modules

Each module owns its router, controller, service, and validation definitions. Future models/repositories should remain inside the owning module unless they are genuinely shared.

| Module | Responsibility |
| --- | --- |
| `auth` | Authentication and session lifecycle |
| `users` | Accounts, roles, and access management |
| `candidates` | Candidate profiles and recruitment records |
| `dashboard` | Operational summaries and metrics |
| `reports` | Reports and export orchestration |
| `excel-import` | Spreadsheet validation and import lifecycle |
| `status-workflow` | Candidate stages and transitions |
| `activity-logs` | Auditable user and system events |

## Implementation rules

1. Routers define paths, middleware order, and controller bindings only.
2. Controllers translate HTTP input/output and delegate business decisions.
3. Services own business rules and transaction orchestration.
4. Validation schemas remain next to their feature and run before controllers.
5. Async handlers use `asyncHandler`; errors are passed to `errorHandler`.
6. Success and failure payloads use the shared response envelope.
7. Cross-module calls should use explicit service APIs, never another module's controller.

## Configuration and startup

Copy `server/.env.example` to `server/.env` when local overrides are needed. From `server`, run `npm install`, then `npm start`. The health check is available at `GET /health`.
