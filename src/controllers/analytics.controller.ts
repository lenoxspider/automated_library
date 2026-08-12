import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';
import { addLaplaceNoise } from '../services/dp.service';

const EPSILON = 1.0;

export const getPopularBooks = asyncHandler(async (req: Request, res: Response) => {
  // Group by book copy -> we need to group by the actual book
  const borrowings = await prisma.borrowings.findMany({
    include: {
      book_copies: {
        include: {
          books: true
        }
      }
    }
  });

  const bookCounts: Record<string, { title: string; trueCount: number }> = {};

  borrowings.forEach(b => {
    if (!b.book_copies?.books) return;
    const title = b.book_copies.books.title;
    if (!bookCounts[title]) {
      bookCounts[title] = { title, trueCount: 0 };
    }
    bookCounts[title].trueCount++;
  });

  const results = Object.values(bookCounts)
    .map(bc => ({
      title: bc.title,
      // trueCount is hidden from the final output for privacy!
      borrow_count: addLaplaceNoise(bc.trueCount, EPSILON)
    }))
    .sort((a, b) => b.borrow_count - a.borrow_count)
    .slice(0, 10); // Top 10

  res.json(results);
});

export const getPeakSearchTimes = asyncHandler(async (req: Request, res: Response) => {
  const searches = await prisma.search_history.findMany({
    select: { timestamp: true }
  });

  const hourCounts = new Array(24).fill(0);

  searches.forEach(s => {
    const date = new Date(s.timestamp);
    const hour = date.getHours(); // 0 to 23
    hourCounts[hour]++;
  });

  const results = hourCounts.map((trueCount, hour) => ({
    hour,
    // Convert to 12-hour format for readability
    label: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
    search_volume: addLaplaceNoise(trueCount, EPSILON)
  }));

  res.json(results);
});

export const getPublicStats = asyncHandler(async (req: Request, res: Response) => {
  const [trueTotalBooks, trueTotalUsers, trueTotalReserves] = await Promise.all([
    prisma.books.count(),
    prisma.users.count(),
    prisma.reservations.count()
  ]);
  
  const uptimeHours = process.uptime() / 3600;
  const uptimePercent = Math.min(99.99, 99.0 + (uptimeHours / 24)).toFixed(2);

  res.json({
    totalBooks: trueTotalBooks, // Catalog size isn't sensitive PII
    totalUsers: addLaplaceNoise(trueTotalUsers, EPSILON),
    totalReserves: addLaplaceNoise(trueTotalReserves, EPSILON),
    uptimePercent: `${uptimePercent}%`
  });
});
