const cron = require('node-cron');
const candidateService = require('../modules/candidates/candidate.service');

// Run every day at midnight to clean up trash
const scheduleTrashCleanup = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running scheduled job: Trash cleanup');
      const result = await candidateService.hardDeleteExpiredCandidates(30);
      console.log(`Trash cleanup complete. Hard deleted ${result.deletedCount} candidates.`);
    } catch (error) {
      console.error(`Error during trash cleanup: ${error.message}`);
    }
  });
};

module.exports = { scheduleTrashCleanup };
