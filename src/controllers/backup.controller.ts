import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { setMaintenanceMode } from '../config/state';
import prisma from '../config/prisma';

const execPromise = util.promisify(exec);
const BACKUP_DIR = path.join(__dirname, '../../backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

export const getBackups = asyncHandler(async (req: Request, res: Response) => {
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.sql'));
  const backups = files
    .map((f) => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        filename: f,
        size: stats.size,
        created_at: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  res.json(backups);
});

export const createBackup = asyncHandler(async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `library-${timestamp}.sql`;
  const backupPath = path.join(BACKUP_DIR, filename);

  // Use docker exec to run pg_dump inside the container.
  // Note: -i is used without -t to avoid adding terminal carriage returns on Windows.
  const command = `docker exec -i smartlib-postgres pg_dump -U smartlib -d library > "${backupPath}"`;
  await execPromise(command);

  // @ts-expect-error - req.user is provided by authentication middleware
  const adminId = req.user.id;
  await prisma.audit_logs.create({
    data: {
      admin_id: adminId,
      action: 'CREATE_BACKUP',
      details: `Created ${filename}`,
      timestamp: new Date().toISOString()
    }
  });

  res.status(201).json({ message: 'Backup created successfully', filename });
});

export const restoreBackup = asyncHandler(async (req: Request, res: Response) => {
  const { filename } = req.body;
  const backupPath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(backupPath)) {
    res.status(404).json({ error: 'Backup file not found' });
    return;
  }

  // 1. Enter Maintenance Mode (blocks new requests)
  setMaintenanceMode(true);

  try {
    // 2. Disconnect Prisma to release connections
    await prisma.$disconnect();

    // 3. Restore database schema and data using psql inside the docker container
    const command = `docker exec -i smartlib-postgres psql -U smartlib -d library < "${backupPath}"`;
    await execPromise(command);

    // 4. Reconnect Prisma
    await prisma.$connect();

    // 5. Exit Maintenance Mode
    setMaintenanceMode(false);

    // @ts-expect-error - req.user is provided by authentication middleware
    const adminId = req.user.id;
    await prisma.audit_logs.create({
      data: {
        admin_id: adminId,
        action: 'RESTORE_BACKUP',
        details: `Restored from ${filename}`,
        timestamp: new Date().toISOString()
      }
    });

    res.json({ message: 'Database restored successfully' });
  } catch (error) {
    setMaintenanceMode(false); // Make sure we don't stay locked
    throw error;
  }
});
