require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Candidate = require('./server/src/modules/candidates/candidate.model');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Fix "In consideration"
    const inConsiderationResult = await Candidate.updateMany(
      { referenceStatus: /in consideration/i },
      { $set: { status: 'Under Consideration', recruitmentStatus: 'Under Consideration' } }
    );
    console.log(`Updated ${inConsiderationResult.modifiedCount} candidates to Under Consideration`);

    // Fix "DNP"
    const dnpResult = await Candidate.updateMany(
      { referenceStatus: /dnp|do not pick|do not proceed/i },
      { $set: { status: 'DNP', recruitmentStatus: 'DNP' } }
    );
    console.log(`Updated ${dnpResult.modifiedCount} candidates to DNP`);

    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
