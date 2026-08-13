import 'dotenv/config';
import { prisma } from './src/config/prisma';
async function main() {
  const users = await prisma.users.findMany({ where: { email: 'charity@example.com' } });
  console.log(users.map(u => ({ email: u.email, token: u.verification_token })));
}
main().finally(() => prisma.$disconnect());
