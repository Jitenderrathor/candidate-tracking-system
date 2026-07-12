# Deployment Guide

## Recommended topology

```text
Browser -> TLS CDN/reverse proxy -> static client
                              \-> Node API -> MongoDB replica set
```

## Backend deployment

1. Provision Node.js 20+ and a MongoDB replica set.
2. Store backend variables in the platform secret manager.
3. Run `npm ci --omit=dev` in `server`.
4. Ensure application indexes exist through a reviewed database migration/deployment step. Production disables Mongoose automatic index creation intentionally.
5. Start with `npm start` under a process supervisor or container orchestrator.
6. Configure readiness checks against `GET /health`.
7. Send `SIGTERM` during rollout so graceful shutdown can drain HTTP and database connections.
8. Apply request-rate limits at the load balancer/API gateway, especially for authentication, password reset, imports, and report endpoints.

Run one seed job only when the initial Admin is required. Do not run default credentials indefinitely.

## Frontend deployment

1. Set `VITE_API_BASE_URL` to the public canonical `/api` endpoint.
2. Run `npm ci` and `npm run build` in `client`.
3. Publish `client/dist` to a static host or CDN.
4. Configure SPA fallback so unknown frontend paths serve `index.html`.
5. Cache hashed assets long-term; serve `index.html` with revalidation.
6. Enable Brotli or gzip at the CDN. ExcelJS is intentionally an on-demand chunk used only for template generation.

## Reverse proxy requirements

- TLS 1.2 or newer
- HTTPS redirect and HSTS after validation
- Forwarded client IP support for audit logs
- Upload body allowance above the API's 20 MB workbook limit
- Request timeout long enough for validated 10,000-row imports
- Rate limiting and abuse monitoring

## MongoDB operations

- Use encrypted connections and least-privilege credentials.
- Enable backups and perform restore drills.
- Monitor pool saturation, slow queries, storage, replication lag, and transaction aborts.
- Review index creation before each deployment; do not run destructive index synchronization automatically.

## Rollback

Keep the previous client artifact and server image. Application rollback must not automatically roll back MongoDB data. Verify backward compatibility before switching traffic, then monitor `/health`, error rate, latency, and transaction failures.
