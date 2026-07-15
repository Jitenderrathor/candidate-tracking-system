const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/modules/auth/user.model');

const PERMISSION_MAPPINGS = {
  'User': ['dashboard', 'candidates', 'reports'],
  'Admin': ['dashboard', 'candidates', 'reports', 'excel_import', 'manage_users', 'recycle_bin', 'email_templates'],
  'Super Admin': ['dashboard', 'candidates', 'reports', 'excel_import', 'manage_users', 'recycle_bin', 'email_templates', 'system_settings', 'manage_admins']
};

const runMigration = async () => {
  try {
    await mongoose.connect(env.mongoUri, { maxPoolSize: env.mongoMaxPoolSize });
    console.log('Connected to MongoDB.');

    const users = await User.find({});
    console.log(`Found ${users.length} users. Migrating permissions...`);

    let updatedCount = 0;
    for (const user of users) {
      if (!user.permissions || user.permissions.length === 0) {
        user.permissions = PERMISSION_MAPPINGS[user.role] || [];
        await user.save();
        updatedCount++;
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
