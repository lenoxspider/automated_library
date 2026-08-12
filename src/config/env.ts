function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Refusing to start without it — see .env.example.`
    );
  }
  return value;
}

export const ACCESS_SECRET = requireEnv('ACCESS_SECRET');
export const REFRESH_SECRET = requireEnv('REFRESH_SECRET');
