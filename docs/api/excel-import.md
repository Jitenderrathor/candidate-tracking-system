# Excel Candidate Import API

## Upload candidates

`POST /api/excel/import`

This endpoint requires an authenticated Admin. Send `multipart/form-data` with the `.xlsx` workbook in a field named `file`.

```bash
curl -X POST http://localhost:5000/api/excel/import \
  -H "Authorization: Bearer <admin-jwt>" \
  -F "file=@candidates.xlsx;type=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
```

Only `.xlsx` files with the official XLSX MIME type are accepted. `.xls`, CSV, PDF, and image files return `415`. The upload limit is 20 MB and 10,000 non-empty data rows.

## Required columns

The first worksheet must contain this header row. Column order may vary.

```text
First Name | Last Name | Gender | Date Of Birth | Email | Mobile |
Address | Qualification | Experience | Current Company | Current CTC |
Expected CTC | Skills | Resume URL | Source | Remarks
```

Skills are comma-separated. Dates may be native Excel dates or parseable date text. Candidate status from the workbook is not accepted; every imported candidate starts as `Registered`.

## Duplicate behavior

A row is skipped when either its normalized email or mobile matches:

- an earlier valid row in the same workbook; or
- an active candidate already in MongoDB.

Candidate IDs are reserved atomically from the existing counter and continue in `CRTS000145` format. Valid candidates are written through one `insertMany()` operation.

## Response

```json
{
  "success": true,
  "message": "Excel import completed",
  "data": {
    "totalRows": 100,
    "imported": 96,
    "skipped": 4,
    "duplicateEmails": 2,
    "duplicateMobiles": 1,
    "validationErrors": [
      { "row": 5, "errors": ["Missing Email"] },
      { "row": 9, "errors": ["Invalid Mobile"] },
      { "row": 15, "errors": ["Duplicate Email"] }
    ]
  }
}
```

Row numbers match Excel worksheet row numbers, including the header row as row 1. `skipped` counts invalid and duplicate rows once, while duplicate email/mobile counters independently report each collision type.

## Activity logs

The system records `EXCEL_IMPORT_STARTED` before parsing and `EXCEL_IMPORT_COMPLETED` with Admin, filename, imported count, skipped count, time, IP, and browser user agent. Candidate insertion, ID reservation, and completion logging share one MongoDB transaction.
