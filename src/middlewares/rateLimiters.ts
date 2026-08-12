import rateLimit from 'express-rate-limit';

// Tighter than the global 100-req/15min limiter in app.ts: login is a brute-force
// target, so cap it at 5 attempts per IP per window regardless of the app-wide limit.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' }
});
