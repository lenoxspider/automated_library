import 'dotenv/config';
import { prisma } from '../src/config/prisma';

// Registration checks a new signup's Student ID + Index Number against this
// roster table before creating an account. Nothing ever populated it, so
// every registration attempt failed roster verification regardless of the
// values entered - this seeds real + demo entries so signup actually works.
const ROSTER: { name: string; student_id: string; index_number: string }[] = [
  { name: 'Kobby Gene', student_id: '21132408', index_number: '6126424' },
  { name: 'Ama Owusu', student_id: '21001122', index_number: '1001122' },
  { name: 'Kwame Asante', student_id: '21003344', index_number: '1003344' },
  { name: 'Efua Mensah', student_id: '21005566', index_number: '1005566' },
  { name: 'Yaw Boateng', student_id: '21007788', index_number: '1007788' },
  { name: 'Akosua Darko', student_id: '21009900', index_number: '1009900' },
];

async function main() {
  let added = 0;
  for (const entry of ROSTER) {
    const existing = await prisma.student_roster.findUnique({
      where: { student_id: entry.student_id }
    });
    if (existing) continue;

    await prisma.student_roster.create({ data: entry });
    console.log(`  + ${entry.name} (${entry.student_id} / ${entry.index_number})`);
    added++;
  }
  console.log(`Done: ${added} roster entr${added === 1 ? 'y' : 'ies'} added.`);
}

main()
  .catch((err) => {
    console.error('Roster seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
