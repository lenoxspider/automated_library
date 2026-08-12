import logger from '../config/logger';
import sharp from 'sharp';
import { uploadCover } from './s3.service';

const FETCH_TIMEOUT_MS = 5000;

async function fetchBufferWithTimeout(url: string): Promise<Buffer | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) return null; // Reject tiny default images / placeholders
    return buffer;
  } catch (err) {
    logger.warn({ err, url }, 'Cover download failed or timed out');
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Tries to fetch cover from OpenLibrary (Large version), falling back to Google Books if not found.
 */
async function fetchCoverBuffer(isbn: string): Promise<Buffer | null> {
  // 1. Try Open Library
  const olUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  const olBuffer = await fetchBufferWithTimeout(olUrl);
  if (olBuffer) return olBuffer;

  // 2. Try Google Books Fallback
  try {
    const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const res = await fetch(gbUrl);
    if (res.ok) {
      const data = await res.json() as any;
      const thumbnail = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
      if (thumbnail) {
        const secureUrl = thumbnail.replace('http://', 'https://');
        const gbBuffer = await fetchBufferWithTimeout(secureUrl);
        if (gbBuffer) return gbBuffer;
      }
    }
  } catch (err) {
    logger.warn({ err, isbn }, 'Google Books lookup fallback failed');
  }

  return null;
}

/**
 * Automatically fetches cover online, processes it via sharp, uploads it to MinIO,
 * and returns the public MinIO URL.
 */
export async function getOrFetchCoverPath(isbn: string | undefined | null): Promise<string | null> {
  if (!isbn) return null;

  try {
    const buffer = await fetchCoverBuffer(isbn);
    if (!buffer) return null;

    // Resize to max 400px wide, compress as progressive JPEG
    const resizedBuffer = await sharp(buffer)
      .resize({ width: 400, withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    // Use a temporary key suffix or the ISBN itself
    const minioUrl = await uploadCover(isbn, resizedBuffer, 'image/jpeg');
    return minioUrl;
  } catch (err) {
    logger.error({ err, isbn }, 'Failed during getOrFetchCoverPath S3 pipeline');
    return null;
  }
}
