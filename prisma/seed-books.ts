import 'dotenv/config';
import { prisma } from '../src/config/prisma';
import { getOrFetchCoverPath } from '../src/services/bookCover.service';
import logger from '../src/config/logger';

// Populates the catalog with real books pulled from OpenLibrary's public
// search API (https://openlibrary.org/search.json - no key required),
// rather than requiring a librarian to type each one in through the UI.
// Subjects chosen to match common university faculties (KNUST-relevant:
// Engineering, Computer Science, Physics, Business, Mathematics, Chemistry,
// Biology, Electrical Engineering, Economics, Agriculture), plus general
// fiction for variety. `page` lets a re-run pull further down OpenLibrary's
// results instead of re-fetching (and skipping as duplicate) the same top
// hits every time.
const SUBJECTS: { query: string; genre: string; limit: number; page?: number }[] = [
  { query: 'engineering', genre: 'Engineering', limit: 4, page: 2 },
  { query: 'computer_science', genre: 'Computer Science', limit: 4, page: 2 },
  { query: 'physics', genre: 'Physics', limit: 3, page: 2 },
  { query: 'business', genre: 'Business', limit: 3, page: 2 },
  { query: 'mathematics', genre: 'Mathematics', limit: 3, page: 2 },
  { query: 'fiction', genre: 'Fiction', limit: 3, page: 2 },
  { query: 'chemistry', genre: 'Chemistry', limit: 3 },
  { query: 'biology', genre: 'Biology', limit: 3 },
  { query: 'electrical_engineering', genre: 'Electrical Engineering', limit: 3 },
  { query: 'economics', genre: 'Economics', limit: 3 },
  { query: 'agriculture', genre: 'Agriculture', limit: 2 }
];

interface OpenLibrarySearchDoc {
  title?: string;
  author_name?: string[];
  isbn?: string[];
}

function pickIsbn(doc: OpenLibrarySearchDoc): string | null {
  // Prefer a 13-digit ISBN (current standard); fall back to a 10-digit one.
  const isbn13 = doc.isbn?.find((i) => /^\d{13}$/.test(i));
  if (isbn13) return isbn13;
  return doc.isbn?.find((i) => /^\d{9}[\dX]$/.test(i)) ?? null;
}

async function fetchSubjectBooks(
  query: string,
  limit: number,
  page = 1
): Promise<OpenLibrarySearchDoc[]> {
  const url = `https://openlibrary.org/search.json?subject=${encodeURIComponent(query)}&limit=${limit * 4}&page=${page}&fields=title,author_name,isbn`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const body = (await res.json()) as { docs: OpenLibrarySearchDoc[] };
  return body.docs ?? [];
}

async function main() {
  let added = 0;
  let skipped = 0;

  for (const { query, genre, limit, page } of SUBJECTS) {
    logger.info(`Fetching "${query}" books from OpenLibrary (page ${page ?? 1})...`);
    const docs = await fetchSubjectBooks(query, limit, page);

    let addedForSubject = 0;
    for (const doc of docs) {
      if (addedForSubject >= limit) break;

      const isbn = pickIsbn(doc);
      if (!isbn || !doc.title || !doc.author_name?.length) {
        skipped++;
        continue;
      }

      const existing = await prisma.books.findUnique({ where: { isbn } });
      if (existing) {
        skipped++;
        continue;
      }

      const coverPath = await getOrFetchCoverPath(isbn).catch(() => null);
      const totalCopies = 2 + Math.floor(Math.random() * 3); // 2-4 copies

      await prisma.books.create({
        data: {
          title: doc.title,
          author: doc.author_name.slice(0, 2).join(', '),
          genre,
          isbn,
          total_copies: totalCopies,
          available_copies: totalCopies,
          cover_path: coverPath,
          book_copies: {
            create: Array.from({ length: totalCopies }).map((_, i) => ({
              barcode: `B-${isbn}-${i + 1}`,
              status: 'Available',
              branch: 'Main Library',
              section: genre,
              shelf: `Shelf ${Math.floor(Math.random() * 10) + 1}`
            }))
          }
        }
      });

      logger.info(`  + ${doc.title} (${isbn}) ${coverPath ? '[cover]' : '[placeholder]'}`);
      added++;
      addedForSubject++;
    }
  }

  logger.info(`Done: ${added} book(s) added, ${skipped} skipped (duplicate ISBN or missing data).`);
}

main()
  .catch((err) => {
    logger.error({ err }, 'Book seeding failed');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
