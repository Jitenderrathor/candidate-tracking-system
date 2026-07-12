# Environment Variables Guide

## Backend (`server/.env`)

| Variable | Required in production | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development`, `test`, or `production` |
| `PORT` | No | HTTP port; defaults to `5000` |
| `API_PREFIX` | No | Legacy/versioned API prefix; defaults to `/api/v1` |
| `CLIENT_ORIGIN` | Yes | Exact allowed browser origin for CORS |
| `MONGODB_URI` | Yes | MongoDB replica-set connection URI |
| `MONGODB_MAX_POOL_SIZE` | No | Maximum MongoDB connection pool size |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS` | No | Database discovery timeout |
| `MONGODB_QUERY_MAX_TIME_MS` | No | Aggregation execution ceiling |
| `JWT_SECRET` | Yes | Random secret of at least 32 characters |
| `JWT_EXPIRES_IN` | No | JWT duration such as `15m` or `1d` |
| `PASSWORD_RESET_EXPIRES_MINUTES` | No | Reset-token validity window |
| `SHUTDOWN_TIMEOUT_MS` | No | Graceful shutdown deadline |

Generate `JWT_SECRET` with a cryptographically secure secret manager. Never reuse secrets between environments.

## Frontend (`client/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Public API base, normally `https://api.example.com/api` |

Vite variables are embedded at build time and are visible to browsers. Never place secrets in `VITE_*` variables. Rebuild the frontend after changing them.
