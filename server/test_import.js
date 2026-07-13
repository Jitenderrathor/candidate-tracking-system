const fs = require('fs');
const path = require('path');
const { parseWorkbook, validateProfileRow } = require('./src/modules/excel-import/excelImport.service');

async function test() {
  const mockRows = [
    {
      rowNumber: 2,
      format: 'profile',
      values: {
        Date: '2026-07-07T10:43:40+05:30',
        Name: 'Valid Candidate',
        Email: 'valid@example.com',
        Phone: '+919999999999',
        Source: 'LinkedIn',
        Gender: 'Male',
      }
    },
    {
      rowNumber: 3,
      format: 'profile',
      values: {
        Date: '2026-07-07T10:43:40+05:30',
        Name: 'Invalid Phone & LinkedIn',
        Email: 'invalid@example.com',
        Phone: 'abc1234',
        LinkedIn: 'not-a-url',
        Source: 'LinkedIn',
        Gender: 'Female',
      }
    }
  ];

  const genderCache = new Map();
  console.log("Testing Row Validation:");
  for (const row of mockRows) {
    const validated = validateProfileRow(row, genderCache);
    console.log(`Row ${row.rowNumber} Errors:`, validated.errors);
  }
}
test();
