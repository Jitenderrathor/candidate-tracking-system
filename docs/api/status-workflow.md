# Recruitment Status Workflow API

All workflow endpoints require `Authorization: Bearer <jwt>`. Candidate references accept a MongoDB document ID or a `CRTS000001` ID.

## Allowed transitions

```text
Registered -> Under Consideration -> To Be Shortlisted -> Selected
Selected --Admin with remarks--> Under Consideration
```

All other transitions return `409 INVALID_STATUS_TRANSITION`. A non-Admin attempting the backward transition receives `403`; a backward Admin transition without remarks receives `422`.

## Change candidate status

`PATCH /api/candidates/:id/status`

Admin and User roles may perform forward transitions. Only Admin may move `Selected` back to `Under Consideration`.

```json
{
  "status": "Under Consideration",
  "remarks": "HR Interview Scheduled"
}
```

```json
{
  "success": true,
  "message": "Candidate status updated successfully",
  "data": {
    "candidate": {
      "candidateId": "CRTS000001",
      "status": "Under Consideration"
    },
    "history": {
      "oldStatus": "Registered",
      "newStatus": "Under Consideration",
      "remarks": "HR Interview Scheduled",
      "changedAt": "2026-07-11T10:00:00.000Z"
    }
  }
}
```

The candidate update, status-history insert, and activity-log insert run in one MongoDB transaction. Failure of any write rolls the entire transition back.

## Get status history

`GET /api/candidates/:id/history`

Returns the complete status timeline ordered by `changedAt` descending. Each record contains candidate identifiers, old/new status, remarks, actor, time, IP address, browser user agent, and timestamps.

## Activity audit

Each successful status transition creates an internal `ActivityLog` record containing the user, candidate, old/new status, event time, IP address, and browser user agent. Activity insertion uses the same transaction as the candidate and history writes.
