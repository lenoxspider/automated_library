import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';
import { z } from 'zod';

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await prisma.library_settings.findMany();
  res.json(settings);
});

export const updateSetting = asyncHandler(async (req: Request, res: Response) => {
  const key = req.params.key as string;
  const { value } = z.object({ value: z.string() }).parse(req.body);

  const setting = await prisma.library_settings.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });

  res.json(setting);
});
