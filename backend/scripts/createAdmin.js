// Make an admin account. Admins cannot sign up on the website.
//   npm run create-admin -- admin@garden.test "Garden Admin" "a-long-password"
require('dotenv').config({ quiet: true });
const authService = require('../services/authService');

async function main() {
  const [email, name, password] = process.argv.slice(2);

  if (!email || !name || !password || password.length < 8) {
    console.log('Usage: npm run create-admin -- <email> "<name>" "<password, 8+ characters>"');
    return;
  }

  const admin = await authService.createUser(name, email.toLowerCase(), password, 'admin');
  console.log(`Admin created: ${admin.name} <${admin.email}>`);
}

main().catch((error) => console.error('Could not create the admin:', error.message));
