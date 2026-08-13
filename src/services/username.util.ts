import prisma from '../config/prisma';

// Derives a professional, login-friendly username from a person's full name
// (e.g. "Kobby Gene" -> "kobby.gene") instead of using their raw email, which
// is unnecessary to expose as a login handle. Falls back to a numeric suffix
// on collision (kobby.gene -> kobby.gene2) rather than erroring out.
export async function generateUsernameFromName(name: string): Promise<string> {
  const base = name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .join('.') || 'user';

  let candidate = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.users.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
}
