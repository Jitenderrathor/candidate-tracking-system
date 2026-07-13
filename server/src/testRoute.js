const express = require('express');
const excelRoutes = require('./modules/excel-import/excelImport.routes');

const app = express();
app.use('/api/excel', excelRoutes);

app.listen(9999, () => {
  console.log('Server running');
  const request = require('http').request({
    hostname: 'localhost',
    port: 9999,
    path: '/api/excel/history',
    method: 'GET'
  }, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    process.exit(0);
  });
  request.end();
});
