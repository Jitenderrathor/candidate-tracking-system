const { connectDatabase, disconnectDatabase } = require('../../config/database');
const User = require('./user.model');

const ADMIN_EMAIL = 'admin@example.com';

const seedAdmin = async () => {
  await connectDatabase();
  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

  if (existingAdmin) {
    console.info(`Admin already exists: ${ADMIN_EMAIL}`);
    return;
  }

  await User.create({
    name: 'System Administrator',
    email: ADMIN_EMAIL,
    password: 'Admin@123',
    role: 'Admin',
  });
  console.info(`Admin created: ${ADMIN_EMAIL}`);
};

seedAdmin()
  .catch((error) => {
    console.error('Admin seed failed', error);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
