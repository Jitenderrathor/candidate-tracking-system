const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const env = require('../src/config/env');
const Candidate = require('../src/modules/candidates/candidate.model');
const { bulkPredictGenders, detectGenderWithCache } = require('../src/common/utils/genderPrediction');

const run = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(env.mongoUri, {
      maxPoolSize: env.mongoMaxPoolSize,
      serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
    });
    console.log('Connected.');

    const candidates = await Candidate.find({});
    console.log(`Found ${candidates.length} candidates.`);

    const firstNames = candidates.map(c => c.firstName);
    console.log(`Fetching predictions for ${firstNames.length} names...`);
    const genderCache = await bulkPredictGenders(firstNames);

    let updatedCount = 0;
    for (const candidate of candidates) {
      const newGender = detectGenderWithCache(candidate.firstName, genderCache);
      if (candidate.gender !== newGender) {
        await Candidate.updateOne({ _id: candidate._id }, { $set: { gender: newGender } });
        updatedCount++;
      }
      if (updatedCount % 100 === 0 && updatedCount > 0) {
        console.log(`Updated ${updatedCount} candidates...`);
      }
    }

    console.log(`Successfully updated ${updatedCount} candidates with higher accuracy.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

run();
