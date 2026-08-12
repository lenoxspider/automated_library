import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';

export const getIntegrations = asyncHandler(async (req: Request, res: Response) => {
  const keys = await prisma.api_keys.findMany({
    orderBy: { id: 'desc' }
  });
  res.json(keys);
});

export const createIntegration = asyncHandler(async (req: Request, res: Response) => {
  const { service_name, token } = req.body;
  const integration = await prisma.api_keys.create({
    data: {
      service_name,
      token,
      created_at: new Date().toISOString()
    }
  });

  // Log audit action
  // @ts-expect-error - req.user is provided by authentication middleware
  const adminId = req.user.id;
  await prisma.audit_logs.create({
    data: {
      admin_id: adminId,
      action: 'CREATE_API_KEY',
      details: `Added ${service_name}`,
      timestamp: new Date().toISOString()
    }
  });

  res.status(201).json(integration);
});

export const deleteIntegration = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);

  const key = await prisma.api_keys.update({
    where: { id },
    data: { status: 'revoked' }
  });

  // Log audit action
  // @ts-expect-error - req.user is provided by authentication middleware
  const adminId = req.user.id;
  await prisma.audit_logs.create({
    data: {
      admin_id: adminId,
      action: 'REVOKE_API_KEY',
      details: `Revoked ${key.service_name}`,
      timestamp: new Date().toISOString()
    }
  });

  res.json({ message: 'API key revoked' });
});
