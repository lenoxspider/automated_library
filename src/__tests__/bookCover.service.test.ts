import fs from 'fs';
import fs_promises from 'fs/promises';
import { getOrFetchCoverPath } from '../services/bookCover.service';

jest.mock('fs');
jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockFsPromises = fs_promises as jest.Mocked<typeof fs_promises>;

describe('bookCover.service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('returns null when no ISBN is given', async () => {
    const result = await getOrFetchCoverPath(undefined);
    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns the cached cover URL without fetching if the file already exists', async () => {
    mockFs.existsSync.mockReturnValue(true);

    const result = await getOrFetchCoverPath('9780135957059');

    expect(result).toBe('/covers/9780135957059.jpg');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches and caches a cover when none exists locally yet', async () => {
    mockFs.existsSync.mockReturnValue(false);
    const fakeImageBytes = Buffer.alloc(5000, 1); // large enough to not look like OpenLibrary's blank placeholder
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => fakeImageBytes.buffer.slice(0, fakeImageBytes.byteLength)
    });

    const result = await getOrFetchCoverPath('9780135957059');

    expect(result).toBe('/covers/9780135957059.jpg');
    expect(mockFsPromises.mkdir).toHaveBeenCalled();
    expect(mockFsPromises.writeFile).toHaveBeenCalled();
  });

  it('falls back to null when OpenLibrary has no real cover (tiny placeholder response)', async () => {
    mockFs.existsSync.mockReturnValue(false);
    const tinyPlaceholder = Buffer.alloc(100, 1); // under the 1000-byte real-cover threshold
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => tinyPlaceholder.buffer.slice(0, tinyPlaceholder.byteLength)
    });

    const result = await getOrFetchCoverPath('0000000000');

    expect(result).toBeNull();
    expect(mockFsPromises.writeFile).not.toHaveBeenCalled();
  });

  it('falls back to null when the fetch fails (network error)', async () => {
    mockFs.existsSync.mockReturnValue(false);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    const result = await getOrFetchCoverPath('9780135957059');

    expect(result).toBeNull();
  });

  it('falls back to null when the fetch returns a non-OK status', async () => {
    mockFs.existsSync.mockReturnValue(false);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    const result = await getOrFetchCoverPath('9780135957059');

    expect(result).toBeNull();
  });

  it('falls back to null if writing the file to disk fails', async () => {
    mockFs.existsSync.mockReturnValue(false);
    const fakeImageBytes = Buffer.alloc(5000, 1);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => fakeImageBytes.buffer.slice(0, fakeImageBytes.byteLength)
    });
    mockFsPromises.mkdir.mockResolvedValue(undefined);
    mockFsPromises.writeFile.mockRejectedValue(new Error('disk full'));

    const result = await getOrFetchCoverPath('9780135957059');

    expect(result).toBeNull();
  });
});
