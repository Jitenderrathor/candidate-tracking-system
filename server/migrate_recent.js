require('dotenv').config();
const mongoose = require('mongoose');
const Candidate = require('./src/modules/candidates/candidate.model');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const dnpResult = await Candidate.updateMany(
      { status: 'Rejected', referenceStatus: /dnp|do not pick/i },
      { $set: { status: 'DNP', recruitmentStatus: 'DNP' } }
    );
    console.log(`Updated ${dnpResult.modifiedCount} Rejected candidates to DNP`);

    const uncResult = await Candidate.updateMany(
      { referenceStatus: /unc|in consideration|under consideration/i, status: { $ne: 'Under Consideration' } },
      { $set: { status: 'Under Consideration', recruitmentStatus: 'Under Consideration' } }
    );
    console.log(`Updated ${uncResult.modifiedCount} candidates to Under Consideration`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
migrate();
