import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

const connection = new Database('./library.db');
const adapter = new PrismaBetterSqlite3(connection);

export const prisma = new PrismaClient({ adapter });
export default prisma;
