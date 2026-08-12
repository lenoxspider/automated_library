import { uploadCover } from '../services/s3.service';
import { getOrFetchCoverPath } from '../services/bookCover.service';

jest.mock('../services/s3.service', () => ({
  uploadCover: jest.fn()
}));

jest.mock('sharp', () => {
  const sharpPipeline = {
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image'))
  };

  return {
    __esModule: true,
    default: jest.fn(() => sharpPipeline)
  };
});

const mockUploadCover = uploadCover as jest.MockedFunction<typeof uploadCover>;

describe('bookCover.service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockUploadCover.mockResolvedValue(
      'http://localhost:9000/book-covers/covers/9780135957059/cover.jpg'
    );
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('returns null when no ISBN is given', async () => {
    const result = await getOrFetchCoverPath(undefined);

    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockUploadCover).not.toHaveBeenCalled();
  });

  it('fetches and uploads a cover when a valid image is available', async () => {
    const fakeImageBytes = Buffer.alloc(5000, 1);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => fakeImageBytes.buffer.slice(0, fakeImageBytes.byteLength)
    });

    const result = await getOrFetchCoverPath('9780135957059');

    expect(result).toBe('http://localhost:9000/book-covers/covers/9780135957059/cover.jpg');
    expect(mockUploadCover).toHaveBeenCalledWith('9780135957059', expect.any(Buffer), 'image/jpeg');
  });

  it('falls back to null when OpenLibrary has no real cover', async () => {
    const tinyPlaceholder = Buffer.alloc(100, 1);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => tinyPlaceholder.buffer.slice(0, tinyPlaceholder.byteLength)
    });

    const result = await getOrFetchCoverPath('0000000000');

    expect(result).toBeNull();
    expect(mockUploadCover).not.toHaveBeenCalled();
  });

  it('falls back to null when the fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    const result = await getOrFetchCoverPath('9780135957059');

    expect(result).toBeNull();
    expect(mockUploadCover).not.toHaveBeenCalled();
  });

  it('falls back to null when the fetch returns a non-OK status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    const result = await getOrFetchCoverPath('9780135957059');

    expect(result).toBeNull();
    expect(mockUploadCover).not.toHaveBeenCalled();
  });

  it('falls back to null if uploading the processed cover fails', async () => {
    const fakeImageBytes = Buffer.alloc(5000, 1);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => fakeImageBytes.buffer.slice(0, fakeImageBytes.byteLength)
    });
    mockUploadCover.mockRejectedValue(new Error('upload failed'));

    const result = await getOrFetchCoverPath('9780135957059');

    expect(result).toBeNull();
  });
});
