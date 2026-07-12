# Recruitment Reports API

All report endpoints require `Authorization: Bearer <jwt>` and are available to both Admin and User roles. Canonical routes use `/api/reports`; `/api/v1/reports` aliases remain available through the existing versioned registry. Soft-deleted candidates are excluded.

## Endpoints

- `GET /api/reports/summary` — overall filtered totals, averages, status counts, and source counts
- `GET /api/reports/candidates` — filtered, searched, sorted, paginated candidate list
- `GET /api/reports/status` — complete status count map
- `GET /api/reports/source` — complete registration-source count map
- `GET /api/reports/monthly` — UTC registration month totals and current selections
- `GET /api/reports/pipeline` — recruitment-stage counts and selection conversion percentage

## Shared filters

Every endpoint supports the same filter query parameters.

| Parameter | Description |
| --- | --- |
| `status` | Exact configured recruitment status |
| `source` | Exact configured registration source |
| `gender` | `Male`, `Female`, `Other`, or `Prefer not to say` |
| `qualification` | Case-insensitive exact qualification |
| `minExperience`, `maxExperience` | Inclusive experience range |
| `minCurrentCTC`, `maxCurrentCTC` | Inclusive current CTC range |
| `minExpectedCTC`, `maxExpectedCTC` | Inclusive expected CTC range |
| `dateFrom`, `dateTo` | Inclusive ISO-8601 registration date range |
| `search` | Candidate full/name parts, candidate ID, email, or mobile |

Candidate list options:

| Parameter | Description |
| --- | --- |
| `sort` | `newest`, `oldest`, `name`, `experience`, `currentCTC`, or `expectedCTC` |
| `page` | Page number; defaults to 1 |
| `limit` | Page size from 1–100; defaults to 20 |

## Sample requests

```http
GET /api/reports/summary?source=LinkedIn&dateFrom=2026-01-01&dateTo=2026-07-31
GET /api/reports/candidates?status=Selected&minExperience=3&sort=experience&page=1
GET /api/reports/monthly?gender=Female&qualification=B.Tech
GET /api/reports/pipeline?source=Referral
```

## Candidate report response

```json
{
  "success": true,
  "message": "Candidate report retrieved successfully",
  "data": {
    "candidates": [
      {
        "candidateId": "CRTS000145",
        "firstName": "Asha",
        "lastName": "Sharma",
        "experienceYears": 5,
        "currentCTC": 900000,
        "expectedCTC": 1200000,
        "source": "LinkedIn",
        "status": "Selected",
        "createdAt": "2026-07-11T08:00:00.000Z"
      }
    ]
  },
  "meta": {
    "total": 41,
    "totalPages": 3,
    "currentPage": 1,
    "pageSize": 20
  }
}
```

## Pipeline response

```json
{
  "success": true,
  "message": "Recruitment pipeline report retrieved successfully",
  "data": {
    "pipeline": {
      "Registered": 40,
      "Under Consideration": 30,
      "To Be Shortlisted": 20,
      "Selected": 10
    },
    "total": 100,
    "conversionPercentage": 10
  }
}
```

Conversion percentage is `Selected / total filtered candidates * 100` and is rounded to two decimal places inside MongoDB.

## Monthly response

```json
{
  "success": true,
  "message": "Monthly report retrieved successfully",
  "data": {
    "monthly": [
      { "month": "2026-06", "registrations": 22, "selections": 5 },
      { "month": "2026-07", "registrations": 18, "selections": 4 }
    ]
  }
}
```

Monthly selections are candidates currently in `Selected`, grouped by their UTC registration month.

## Aggregation pipelines

- A shared `$match` combines active-candidate filtering with all requested filters and regex search.
- Candidate lists use `$facet`, `$sort`, `$skip`, `$limit`, `$project`, and `$count` for one-query pagination.
- Summary, status, and source reports use `$facet`, `$group`, `$map`, `$filter`, and `$arrayToObject` to return fixed categories with zero values.
- Monthly reports use `$dateToString`, `$group`, conditional `$sum`, `$sort`, and `$project`.
- Pipeline reports use `$facet`, `$group`, `$arrayToObject`, `$divide`, `$multiply`, and `$round` for stage totals and conversion.
