import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export async function getInventory(req: Request, res: Response) {
  try {
    const { page = '1', limit = '50', branch, section, shelf, status, search } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.book_copiesWhereInput = {};

    if (branch) where.branch = branch as string;
    if (section) where.section = section as string;
    if (shelf) where.shelf = shelf as string;

    if (status) {
      const statuses = (status as string).split(',').map((s: string) => s.trim());
      where.status = { in: statuses };
    }

    if (search) {
      const searchStr = search as string;
      where.OR = [
        { barcode: { contains: searchStr } },
        { books: { title: { contains: searchStr } } },
        { books: { author: { contains: searchStr } } },
        { books: { isbn: { contains: searchStr } } }
      ];
    }

    const [data, count] = await Promise.all([
      prisma.book_copies.findMany({
        where,
        skip,
        take: limitNumber,
        include: {
          books: {
            select: { title: true, author: true, isbn: true, cover_path: true }
          }
        },
        orderBy: { id: 'desc' }
      }),
      prisma.book_copies.count({ where })
    ]);

    const locationsRaw = await prisma.book_copies.groupBy({
      by: ['branch', 'section', 'shelf'],
      _count: { _all: true }
    });

    res.json({ data, count, locationsRaw });
  } catch (error) {
    console.error('Inventory GET error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
}

export async function updateBulkInventory(req: Request, res: Response) {
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    const result = await prisma.book_copies.updateMany({
      where: { id: { in: ids } },
      data: updates
    });

    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Inventory PATCH error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
}

export async function updateSingleInventory(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const { branch, section, shelf, status } = req.body;
    const updated = await prisma.book_copies.update({
      where: { id },
      data: {
        branch,
        section,
        shelf,
        status,
        lost_at: status?.toLowerCase() === 'lost' ? new Date() : null
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Inventory single PATCH error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
}
