require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const dashboardService = require('./server/src/modules/dashboard/dashboard.service');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const summary = await dashboardService.getSummary();
    console.log(summary.statusSummary);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
