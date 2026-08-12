import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const librarianEmail = process.env.LIBRARIAN_EMAIL || 'librarian@smartlib.com';
  const librarianPassword = process.env.LIBRARIAN_PASSWORD || 'librarian123';

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment to seed the admin user.');
  }

  // 1. Seed Admin
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.users.upsert({
    where: { username: adminEmail },
    update: {},
    create: {
      username: adminEmail,
      password: adminHash,
      role: 'admin',
      name: 'System Admin',
      email: adminEmail,
      is_verified: 1
    }
  });
  console.log(`Admin user ready: ${admin.username} (id=${admin.id})`);

  // 2. Seed Librarian
  const librarianHash = await bcrypt.hash(librarianPassword, 10);
  const librarian = await prisma.users.upsert({
    where: { username: librarianEmail },
    update: {},
    create: {
      username: librarianEmail,
      password: librarianHash,
      role: 'librarian',
      name: 'System Librarian',
      email: librarianEmail,
      is_verified: 1
    }
  });
  console.log(`Librarian user ready: ${librarian.username} (id=${librarian.id})`);
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
