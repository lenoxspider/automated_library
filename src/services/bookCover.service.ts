import fs from 'fs';
import fs_promises from 'fs/promises';
import path from 'path';
import logger from '../config/logger';

// Covers are written into the Next.js frontend's public/ dir so they're
// served directly by the frontend at /covers/{isbn}.jpg - no separate
// static route needed on the API. The stored cover_path is that
// frontend-relative URL, not a filesystem path or the external OpenLibrary
// URL, so a book's cover keeps working entirely offline (including during a
// live presentation) once it has been fetched once.
const COVERS_DIR = path.join(process.cwd(), 'client', 'public', 'covers');
// 3s (the original spec figure) proved too tight in practice - a real
// fetch to OpenLibrary from this environment measured ~3.1s. 5s keeps
// book creation snappy while giving real-world TLS/connection latency
// enough headroom to actually succeed instead of always falling back.
const FETCH_TIMEOUT_MS = 5000;

function coverUrlFor(isbn: string): string {
  return `/covers/${isbn}.jpg`;
}

function coverFilePathFor(isbn: string): string {
  return path.join(COVERS_DIR, `${isbn}.jpg`);
}

async function fetchCoverBuffer(isbn: string): Promise<Buffer | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`, {
      signal: controller.signal
    });

    // OpenLibrary returns a 200 with a tiny 1x1 placeholder GIF (~807 bytes)
    // when it has no cover for the ISBN, instead of a 404 - filter that out
    // so we don't cache their "no cover" placeholder as a real cover.
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) return null;

    return buffer;
  } catch (err) {
    logger.warn({ err, isbn }, 'Cover fetch failed or timed out');
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Returns a frontend-relative cover URL (/covers/{isbn}.jpg) for the given
 * ISBN, using a locally cached file if one already exists, otherwise
 * fetching it from OpenLibrary and caching it to disk. Returns null (never
 * throws) if no ISBN is given or no cover could be fetched - callers should
 * treat null as "no cover", which the frontend already renders as a
 * generated placeholder (see client/src/components/ui/BookCover.tsx), so
 * there's never a broken image icon.
 */
export async function getOrFetchCoverPath(isbn: string | undefined | null): Promise<string | null> {
  if (!isbn) return null;

  const filePath = coverFilePathFor(isbn);

  if (fs.existsSync(filePath)) {
    return coverUrlFor(isbn);
  }

  const buffer = await fetchCoverBuffer(isbn);
  if (!buffer) return null;

  try {
    await fs_promises.mkdir(COVERS_DIR, { recursive: true });
    await fs_promises.writeFile(filePath, buffer);
    return coverUrlFor(isbn);
  } catch (err) {
    logger.warn({ err, isbn }, 'Failed to write cover file to disk');
    return null;
  }
}
