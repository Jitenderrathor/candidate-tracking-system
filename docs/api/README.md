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
- `GET /api/v1/auth`
- `GET /api/v1/users`
- `GET /api/v1/candidates`
- `GET /api/v1/dashboard`
- `GET /api/v1/reports`
- `GET /api/v1/excel-import`
- `GET /api/v1/status-workflow`
- `GET /api/v1/activity-logs`

The module routes are readiness endpoints only. Domain endpoints will be added with their business implementations.

