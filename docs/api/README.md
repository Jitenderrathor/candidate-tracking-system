# API Contract

The versioned API prefix defaults to `/api/v1`.

## Response envelopes

Successful responses:

```json
{ "success": true, "message": "Success", "data": {}, "meta": {} }
```

Failed responses:

```json
{ "success": false, "error": { "message": "Reason", "code": "ERROR_CODE", "details": [] } }
```

`meta`, `code`, and `details` appear only when applicable.

## Current routes

- `GET /health`
- Authentication: [`authentication.md`](authentication.md)
- Candidates: [`candidates.md`](candidates.md)
- Recruitment workflow: [`status-workflow.md`](status-workflow.md)
- Dashboard analytics: [`dashboard.md`](dashboard.md)
- Excel candidate import: [`excel-import.md`](excel-import.md)
- Recruitment reports: [`reports.md`](reports.md)
- User management: `GET/POST /api/users`, `GET/PUT /api/users/:id`, activation, deactivation, and password reset actions
- `GET /api/v1/activity-logs`

Canonical feature APIs are exposed beneath `/api`. The versioned prefix remains available for centrally registered compatibility routes. Activity logs currently expose a readiness endpoint; audit records are written internally by transactional services.
