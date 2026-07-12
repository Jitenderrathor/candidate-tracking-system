# Production Checklist

## Build and quality

- [ ] `npm ci` succeeds in both `server` and `client`
- [ ] Backend syntax check and all tests pass
- [ ] Frontend lint, formatting check, and production build pass
- [ ] Both dependency audits report no known vulnerabilities
- [ ] Release artifacts are generated from a clean, reviewed commit

## Configuration and security

- [ ] `NODE_ENV=production`
- [ ] Unique 32+ character `JWT_SECRET` stored in a secret manager
- [ ] Exact production `CLIENT_ORIGIN`
- [ ] HTTPS enabled end to end
- [ ] Edge rate limits configured
- [ ] Default Admin password changed
- [ ] Least-privilege MongoDB credentials and encrypted connection configured
- [ ] Logs exclude passwords, JWTs, reset tokens, and temporary passwords

## Database

- [ ] MongoDB replica set available and healthy
- [ ] Required indexes deployed and verified
- [ ] Backups enabled and restore procedure tested
- [ ] Status-change and Excel-import transactions smoke-tested
- [ ] Connection pool and query timeout values reviewed for expected load

## Frontend

- [ ] `VITE_API_BASE_URL` points to the canonical production API
- [ ] SPA fallback configured
- [ ] Hashed assets cached and compressed
- [ ] Login, role guards, keyboard navigation, dialogs, tables, and responsive breakpoints smoke-tested
- [ ] `.xlsx` template download and upload tested in supported browsers

## Operations

- [ ] `/health` monitored
- [ ] Error rate, latency, CPU, memory, MongoDB pool, and transaction alerts configured
- [ ] Graceful `SIGTERM` shutdown verified
- [ ] Rollback artifact and runbook available
- [ ] JWT revocation/incident-response policy documented
