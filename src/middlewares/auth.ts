import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import redisClient from '../config/redis';
import { ACCESS_SECRET } from '../config/env';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    // Cookie is the source of truth for the browser client; the Bearer header
    // fallback keeps Swagger UI and non-browser API callers working.
    const token = (req as any).cookies?.accessToken || bearerToken;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if token is blacklisted in Redis (optional, usually done for access tokens on logout)
    const isBlacklisted = await redisClient.get(`bl_${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload;
    (req as any).user = { id: decoded.sub, role: decoded.role };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};
