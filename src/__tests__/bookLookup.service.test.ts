import { lookupBookByIsbn } from '../services/bookLookup.service';

describe('bookLookup.service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('returns title/author/genre when OpenLibrary has the ISBN', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        'ISBN:9780135957059': {
          title: 'The Pragmatic Programmer',
          authors: [{ name: 'David Thomas' }, { name: 'Andrew Hunt' }],
          subjects: [{ name: 'Computer programming' }]
        }
      })
    });

    const result = await lookupBookByIsbn('9780135957059');

    expect(result).toEqual({
      title: 'The Pragmatic Programmer',
      author: 'David Thomas, Andrew Hunt',
      genre: 'Computer programming'
    });
  });

  it('returns null when the ISBN has no entry', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });

    const result = await lookupBookByIsbn('0000000000');

    expect(result).toBeNull();
  });

  it('returns null on a non-OK response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    const result = await lookupBookByIsbn('9780135957059');

    expect(result).toBeNull();
  });

  it('returns null on network failure instead of throwing', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    await expect(lookupBookByIsbn('9780135957059')).resolves.toBeNull();
  });

  it('falls back to "Unknown" author when no authors are listed', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ 'ISBN:123': { title: 'Mystery Book' } })
    });

    const result = await lookupBookByIsbn('123');

    expect(result).toEqual({ title: 'Mystery Book', author: 'Unknown', genre: null });
  });
});
