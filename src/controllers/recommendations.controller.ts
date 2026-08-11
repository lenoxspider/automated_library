import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';

export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.id;

  // 1. Fetch user's past borrowings to determine their favorite genres
  const pastBorrowings = await prisma.borrowings.findMany({
    where: { member_id: userId },
    include: { book_copies: { include: { books: true } } }
  });

  // Extract genres
  const genreCounts: Record<string, number> = {};
  pastBorrowings.forEach(b => {
    const genre = b.book_copies.books.genre;
    if (genre) {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    }
  });

  // Sort genres by frequency
  const favoriteGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  let recommendedBooks: any[] = [];

  if (favoriteGenres.length > 0) {
    // Top 2 genres
    const topGenres = favoriteGenres.slice(0, 2);
    
    recommendedBooks = await prisma.books.findMany({
      where: { 
        genre: { in: topGenres },
        available_copies: { gt: 0 }
      },
      take: 12,
      orderBy: { id: 'desc' }
    });
  }

  // If we couldn't find enough genre-based books (or it's a new user), 
  // fall back to popularity/recently added
  if (recommendedBooks.length < 5) {
    const fallbackBooks = await prisma.books.findMany({
      where: { available_copies: { gt: 0 } },
      take: 12 - recommendedBooks.length,
      orderBy: { id: 'desc' } // proxy for new/popular in this mock
    });
    
    // Merge and deduplicate
    const existingIds = new Set(recommendedBooks.map(b => b.id));
    fallbackBooks.forEach(b => {
      if (!existingIds.has(b.id)) {
        recommendedBooks.push(b);
      }
    });
  }

  res.json({
    strategy: favoriteGenres.length > 0 ? 'personalized' : 'popularity',
    topGenres: favoriteGenres.slice(0, 2),
    books: recommendedBooks
  });
});
