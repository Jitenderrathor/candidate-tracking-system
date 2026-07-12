# Authentication API

Authentication endpoints use the canonical `/api/auth` base path. They are also available under `/api/v1/auth` for compatibility with the existing versioned route registry.

Protected endpoints require `Authorization: Bearer <jwt>`. JWT lifetime is configured with `JWT_EXPIRES_IN`.

## Login

`POST /api/auth/login`

```json
{ "email": "admin@example.com", "password": "Admin@123" }
```

Returns `200` with a JWT and the user fields excluding password and reset-token data. Returns `401` for invalid credentials and `403` for an inactive account.

## Change password

`POST /api/auth/change-password` (User or Admin)

```json
{ "oldPassword": "Admin@123", "newPassword": "NewAdmin@456" }
```

Returns `200` after hashing and saving the new password. Returns `400` when the old password is incorrect.

## Forgot password

`POST /api/auth/forgot-password`

```json
{ "email": "admin@example.com" }
```

Creates a cryptographically random, time-limited reset token. The database stores only its SHA-256 digest. In development, the raw token is returned as `data.resetToken`; other environments return no token. The response is identical for unknown accounts to prevent account enumeration.

## Reset password

`POST /api/auth/reset-password`

```json
{ "token": "reset-token", "newPassword": "NewAdmin@456" }
```

Returns `200` after updating the password and invalidating the reset token. Returns `400` for an invalid or expired token.

## Profile

`GET /api/auth/profile` (User or Admin)

Returns `200` with the authenticated user profile and no sensitive fields.

## Password policy

New passwords must be 8–72 characters and include uppercase, lowercase, numeric, and special characters.

## Seed administrator

Configure `MONGODB_URI`, then run `npm run seed:admin` from `server`. The script creates `admin@example.com` with password `Admin@123` and role `Admin` only when that email does not already exist.
