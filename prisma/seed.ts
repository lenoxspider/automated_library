import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment to seed the admin user.');
  }

  const hash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.users.upsert({
    where: { username: adminEmail },
    update: {},
    create: {
      username: adminEmail,
      password: hash,
      role: 'admin',
      name: 'System Admin',
      email: adminEmail,
      is_verified: 1
    }
  });

  console.log(`Admin user ready: ${admin.username} (id=${admin.id})`);
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
