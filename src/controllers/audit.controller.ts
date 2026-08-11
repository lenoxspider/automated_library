import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await prisma.audit_logs.findMany({
    orderBy: { id: 'desc' }
  });
  res.json(logs);
});
