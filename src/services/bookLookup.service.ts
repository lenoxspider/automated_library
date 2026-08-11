import logger from '../config/logger';

const FETCH_TIMEOUT_MS = 5000;

export interface BookLookupResult {
  title: string;
  author: string;
  genre: string | null;
}

interface OpenLibraryBookData {
  title?: string;
  authors?: { name: string }[];
  subjects?: { name: string }[];
}

/**
 * Looks up a book's title/author/subject by ISBN via the OpenLibrary Books
 * API (https://openlibrary.org/dev/docs/api/books - no key required).
 * Returns null (never throws) if the ISBN isn't found or the request
 * fails/times out - callers should treat null as "no match", not an error,
 * and let the librarian fill the form in manually.
 */
export async function lookupBookByIsbn(isbn: string): Promise<BookLookupResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`,
      { signal: controller.signal }
    );

    if (!res.ok) return null;

    const body = (await res.json()) as Record<string, OpenLibraryBookData>;
    const entry = body[`ISBN:${isbn}`];
    if (!entry || !entry.title) return null;

    return {
      title: entry.title,
      author: entry.authors?.map((a) => a.name).join(', ') || 'Unknown',
      genre: entry.subjects?.[0]?.name ?? null
    };
  } catch (err) {
    logger.warn({ err, isbn }, 'Book lookup failed or timed out');
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
