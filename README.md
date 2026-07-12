# Candidate Registration & Tracking System

Production-oriented MERN application for candidate registration, recruitment workflow, dashboards, reporting, Excel import, activity auditing, and role-based user administration.

## Repository

```text
client/   React 18 + Vite + Tailwind CSS
server/   Node.js + Express + MongoDB/Mongoose
docs/     Architecture, API, installation, deployment, and release guidance
```

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- MongoDB 6 or newer
- A MongoDB replica set for transaction-backed status changes and Excel imports

## Quick start

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env

cd server
npm install
npm run seed:admin
npm run dev
```

In another terminal:

```powershell
cd client
npm install
npm run dev
```

The frontend defaults to `http://localhost:5173`; the API defaults to `http://localhost:5000`.

## Verification

```powershell
cd server
npm run check
npm test
npm audit

cd ../client
npm run lint
npm run format:check
npm run build
npm audit
```

## Documentation

- [Installation guide](docs/INSTALLATION.md)
- [Environment variables](docs/ENVIRONMENT.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Production checklist](docs/PRODUCTION_CHECKLIST.md)
- [Architecture](docs/architecture/README.md)
- [API reference](docs/api/README.md)

Never commit `.env` files, production secrets, database exports, uploaded workbooks, or generated temporary passwords.
