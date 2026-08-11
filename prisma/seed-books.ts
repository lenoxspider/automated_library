import 'dotenv/config';
import { prisma } from '../src/config/prisma';
import { getOrFetchCoverPath } from '../src/services/bookCover.service';
import logger from '../src/config/logger';

// Populates the catalog with real books pulled from OpenLibrary's public
// search API (https://openlibrary.org/search.json - no key required),
// rather than requiring a librarian to type each one in through the UI.
// Subjects chosen to match common university faculties (KNUST-relevant:
// Engineering, Computer Science, Physics, Business, Mathematics), plus a
// couple of general fiction titles for variety.
const SUBJECTS: { query: string; genre: string; limit: number }[] = [
  { query: 'engineering', genre: 'Engineering', limit: 3 },
  { query: 'computer_science', genre: 'Computer Science', limit: 3 },
  { query: 'physics', genre: 'Physics', limit: 2 },
  { query: 'business', genre: 'Business', limit: 2 },
  { query: 'mathematics', genre: 'Mathematics', limit: 2 },
  { query: 'fiction', genre: 'Fiction', limit: 2 }
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

async function fetchSubjectBooks(query: string, limit: number): Promise<OpenLibrarySearchDoc[]> {
  const url = `https://openlibrary.org/search.json?subject=${encodeURIComponent(query)}&limit=${limit * 4}&fields=title,author_name,isbn`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const body = (await res.json()) as { docs: OpenLibrarySearchDoc[] };
  return body.docs ?? [];
}

async function main() {
  let added = 0;
  let skipped = 0;

  for (const { query, genre, limit } of SUBJECTS) {
    logger.info(`Fetching "${query}" books from OpenLibrary...`);
    const docs = await fetchSubjectBooks(query, limit);

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
          cover_path: coverPath
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
