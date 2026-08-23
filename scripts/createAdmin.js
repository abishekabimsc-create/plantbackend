/**
 * Creates (or refreshes) the admin account from ADMIN_USERNAME / ADMIN_PASSWORD.
 * The password is only ever stored as a bcrypt hash.
 *
 *   npm run create-admin
 *
 * The API also runs this automatically on every boot, so it is only needed
 * when you want to rotate the password without restarting the server.
 */
const config = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../config/db');
const { ensureAdminAccount } = require('../controllers/authController');

async function run() {
  try {
    await connectDatabase();
    const { admin, created, updated } = await ensureAdminAccount({ silent: true });

    if (created) console.log(`Created admin "${admin.username}".`);
    else if (updated) console.log(`Updated the password for admin "${admin.username}".`);
    else console.log(`Admin "${admin.username}" is already up to date.`);

    console.log('Sign in at /admin/login with the credentials in backend/.env.');
  } catch (error) {
    console.error('Could not create the admin account:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase().catch(() => {});
  }
}

run();
