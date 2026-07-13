require('dotenv').config();
const mongoose = require('mongoose');
const dashboardService = require('./src/modules/dashboard/dashboard.service');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const summary = await dashboardService.getSummary();
    console.log('Status Summary:', summary.statusSummary);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
