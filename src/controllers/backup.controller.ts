import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import fs from 'fs';
import path from 'path';
import { setMaintenanceMode } from '../config/state';
import prisma from '../config/prisma';

const DB_PATH = path.join(__dirname, '../../prisma/library.db');
const BACKUP_DIR = path.join(__dirname, '../../backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

export const getBackups = asyncHandler(async (req: Request, res: Response) => {
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.db'));
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
  const filename = `library-${timestamp}.db`;
  const backupPath = path.join(BACKUP_DIR, filename);

  fs.copyFileSync(DB_PATH, backupPath);

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
    // 2. Disconnect Prisma to release the file lock
    await prisma.$disconnect();

    // 3. Overwrite the database file
    fs.copyFileSync(backupPath, DB_PATH);

    // 4. Reconnect Prisma
    await prisma.$connect();

    // 5. Exit Maintenance Mode
    setMaintenanceMode(false);

    // Note: Logging this might be tricky since the DB just swapped, but let's log it in the newly restored DB.
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
