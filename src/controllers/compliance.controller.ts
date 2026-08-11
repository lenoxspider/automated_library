import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';

export const getRequests = asyncHandler(async (req: Request, res: Response) => {
  const requests = await prisma.compliance_requests.findMany({
    orderBy: { id: 'desc' }
  });
  res.json(requests);
});

export const processRequest = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);

  const request = await prisma.compliance_requests.findUnique({ where: { id } });
  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  if (request.request_type === 'ACCOUNT_DELETION') {
    // Hard delete user and all cascade data
    await prisma.users.delete({ where: { id: request.member_id } });
  }

  // Mark resolved
  await prisma.compliance_requests.update({
    where: { id },
    data: { status: 'completed' }
  });

  // Log audit action
  // @ts-ignore
  const adminId = req.user.id;
  await prisma.audit_logs.create({
    data: { admin_id: adminId, action: 'PROCESS_COMPLIANCE', details: `Processed ${request.request_type} for member ${request.member_id}`, timestamp: new Date().toISOString() }
  });

  res.json({ message: 'Compliance request processed successfully' });
});
