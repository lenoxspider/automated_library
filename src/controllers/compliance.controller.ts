import { Request, Response } from 'express';
import { container } from 'tsyringe';
import asyncHandler from 'express-async-handler';
import { ComplianceService, ComplianceError } from '../services/compliance.service';

const complianceService = container.resolve(ComplianceService);

export const getRequests = asyncHandler(async (req: Request, res: Response) => {
  const requests = await complianceService.getRequests();
  res.json(requests);
});

export const processRequest = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  // @ts-expect-error - req.user is provided by authentication middleware
  const adminId = req.user.id;

  try {
    await complianceService.processRequest(id, adminId);
    res.json({ message: 'Compliance request processed successfully' });
  } catch (err) {
    if (err instanceof ComplianceError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});
