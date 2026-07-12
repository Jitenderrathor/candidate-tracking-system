# Installation Guide

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB 6+ running as a replica set
- PowerShell examples below; equivalent shell commands are acceptable

## Backend

```powershell
cd server
Copy-Item .env.example .env
npm ci
npm run seed:admin
npm run check
npm test
npm start
```

Update `.env` before starting. The seed is idempotent and does not duplicate the default Admin.

## Frontend

```powershell
cd client
Copy-Item .env.example .env
npm ci
npm run lint
npm run format:check
npm run build
npm run preview
```

For development, use `npm run dev` instead of `npm run preview`.

## Local MongoDB transactions

Status workflow and Excel import use MongoDB transactions. A standalone MongoDB process is insufficient. Configure a single-node replica set for local development or use a managed replica-set deployment.

## Default Admin

- Email: `admin@example.com`
- Initial password: `Admin@123`

Change this password immediately outside local development.
