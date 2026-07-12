# Candidate Management API

Candidate endpoints use `/api/candidates` and are also available under `/api/v1/candidates` through the existing versioned registry. Every request requires `Authorization: Bearer <jwt>`.

Admin and User roles can create, list, view, and update candidates. Only Admin can delete candidates.

## Create candidate

`POST /api/candidates`

The server creates an atomic sequential ID in `CRTS000001` format. The email and mobile combination must be unique among active candidates.

```json
{
  "firstName": "Asha",
  "lastName": "Sharma",
  "gender": "Female",
  "dateOfBirth": "1995-06-15",
  "email": "asha@example.com",
  "mobile": "+919876543210",
  "address": "Pune, Maharashtra",
  "qualification": "B.Tech",
  "experienceYears": 4,
  "currentCompany": "Example Technologies",
  "currentCTC": 800000,
  "expectedCTC": 1100000,
  "skills": ["React", "Node.js", "MongoDB"],
  "resumeUrl": "https://example.com/resumes/asha.pdf",
  "source": "LinkedIn",
  "remarks": "Available after 30 days"
}
```

Returns `201` with the created candidate.

## List candidates

`GET /api/candidates`

Query parameters:

| Parameter | Purpose |
| --- | --- |
| `search` | Case-insensitive candidate ID, name, email, or mobile search |
| `status` | Exact status filter |
| `source` | Exact source filter |
| `qualification` | Case-insensitive exact qualification filter |
| `minExperience`, `maxExperience` | Inclusive experience range |
| `createdFrom`, `createdTo` | Inclusive ISO-8601 created-date range |
| `page` | Page number; defaults to 1 |
| `limit` | Page size, 1–100; defaults to 10 |
| `sort` | Comma-separated fields; prefix descending fields with `-` |

Example: `GET /api/candidates?search=asha&status=Registered&page=1&limit=20&sort=-createdAt`

```json
{
  "success": true,
  "message": "Candidates retrieved successfully",
  "data": { "candidates": [] },
  "meta": { "total": 0, "totalPages": 0, "currentPage": 1 }
}
```

## Get candidate

`GET /api/candidates/:id`

`:id` accepts a MongoDB document ID or a `CRTS000001` candidate ID. Returns `404` when the candidate does not exist or was deleted.

## Update candidate

`PUT /api/candidates/:id`

Accepts any editable create field except `candidateId` and `status`; at least one editable field is required. Status can only be changed through the recruitment workflow API. Audit ownership is taken from the authenticated user.

```json
{ "expectedCTC": 1200000, "remarks": "Compensation discussed" }
```

## Delete candidate

`DELETE /api/candidates/:id` (Admin only)

Performs a soft delete by setting `isDeleted`, `deletedAt`, and `deletedBy`. Deleted records are excluded from all candidate reads.

## Allowed values

Statuses: `Registered`, `Under Consideration`, `To Be Shortlisted`, `Selected`.

Sources: `Website`, `Referral`, `Job Portal`, `Walk-in`, `LinkedIn`, `Facebook`, `Instagram`, `Other`.

Genders: `Male`, `Female`, `Other`, `Prefer not to say`.
