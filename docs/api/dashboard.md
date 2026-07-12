# Dashboard Analytics API

Dashboard endpoints are public and require no authentication. The public dashboard and logged-in dashboard consume the same responses. Canonical routes use `/api/dashboard`; `/api/v1/dashboard` aliases remain available through the existing versioned registry.

## Summary

`GET /api/dashboard/summary`

```json
{
  "success": true,
  "message": "Dashboard summary retrieved successfully",
  "data": {
    "totalCandidates": 125,
    "activeCandidates": 120,
    "statusSummary": {
      "Registered": 45,
      "Under Consideration": 35,
      "To Be Shortlisted": 25,
      "Selected": 15
    },
    "sourceSummary": {
      "Website": 20,
      "Referral": 18,
      "Job Portal": 30,
      "Walk-in": 8,
      "LinkedIn": 25,
      "Facebook": 5,
      "Instagram": 4,
      "Other": 10
    },
    "monthlyTrend": [
      { "month": "2026-07", "registrationCount": 12 }
    ],
    "recentCandidates": [
      {
        "candidateId": "CRTS000125",
        "name": "Asha Sharma",
        "source": "LinkedIn",
        "status": "Registered",
        "createdAt": "2026-07-11T08:00:00.000Z"
      }
    ]
  }
}
```

`totalCandidates` is the all-time registration count, including soft-deleted registrations. `activeCandidates` and every breakdown/list exclude soft-deleted candidates.

## Status summary

`GET /api/dashboard/status-summary`

Returns `data.statusSummary` with every configured recruitment status. Missing categories are returned as zero.

## Source summary

`GET /api/dashboard/source-summary`

Returns `data.sourceSummary` with every configured registration source. Missing categories are returned as zero.

## Monthly trend

`GET /api/dashboard/monthly-trend`

Returns `data.monthlyTrend` containing exactly the current UTC calendar month and previous 11 months, oldest first. Months without registrations have `registrationCount: 0`.

## Recent candidates

`GET /api/dashboard/recent`

Returns `data.recentCandidates` with at most ten active candidates ordered by newest registration first. Only candidate ID, display name, source, status, and creation date are exposed.

## Aggregation implementation

- `$group` and conditional `$sum` calculate all-time and active totals.
- `$match`, `$facet`, `$group`, `$filter`, `$map`, and `$arrayToObject` calculate complete status/source maps inside MongoDB.
- `$dateTrunc`, `$range`, `$dateAdd`, `$dateToString`, `$filter`, and `$map` build and zero-fill the 12-month UTC trend inside MongoDB.
- `$match`, `$sort`, `$limit`, and `$project` return the ten recent candidates without exposing private candidate fields.
