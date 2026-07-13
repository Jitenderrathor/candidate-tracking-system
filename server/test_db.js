require('dotenv').config();
const mongoose = require('mongoose');
const Candidate = require('./src/modules/candidates/candidate.model');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const candidate = await Candidate.findOne({ status: 'Rejected', referenceStatus: /dnp|do not pick/i });
    console.log(candidate);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
