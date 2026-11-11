import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from './config/db';
import { env } from './config/env';
import { User } from './models/User';

async function seed() {
  await connectDatabase();

  const existing = await User.findOne({ username: env.seed.secretaryUsername });
  if (existing) {
    console.log(`Secretary account "${env.seed.secretaryUsername}" already exists. Nothing to do.`);
  } else {
    const passwordHash = await bcrypt.hash(env.seed.secretaryPassword, 12);
    await User.create({
      username: env.seed.secretaryUsername,
      fullName: env.seed.secretaryFullName,
      passwordHash,
      role: 'secretary',
      mustChangePassword: true,
    });
    console.log(`Created initial Barangay Secretary account: "${env.seed.secretaryUsername}"`);
    console.log('Change the temporary password after first login.');
  }

  await disconnectDatabase();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
