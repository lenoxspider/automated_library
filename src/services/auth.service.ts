import { injectable } from 'tsyringe';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { users } from '@prisma/client';
import { UserRepository } from '../repositories/user.repo';
import { UserService } from './user.service';
import { EmailService } from './email.service';
import redisClient from '../config/redis';
import prisma from '../config/prisma';
import { ACCESS_SECRET, REFRESH_SECRET, LIBRARIAN_SIGNUP_CODE } from '../config/env';
import { generateUsernameFromName } from './username.util';

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

interface RegisterInput {
  password: string;
  name: string;
  email: string;
  studentId?: string;
  indexNumber?: string;
  librarianCode?: string;
}

@injectable()
export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private userService: UserService,
    private emailService: EmailService
  ) {}

  async login(username: string, password: string) {
    const user = await this.userRepo.findByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AuthError(401, 'Invalid username or password');
    }

    const accessToken = jwt.sign({ sub: user.id, role: user.role }, ACCESS_SECRET, {
      expiresIn: '15m'
    });
    const refreshToken = jwt.sign({ sub: user.id }, REFRESH_SECRET, { expiresIn: '30d' });

    await redisClient.set(`rt_${user.id}`, refreshToken, 'EX', 30 * 24 * 60 * 60);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  async logout(accessToken: string | undefined, userId: number | undefined) {
    if (accessToken) {
      await redisClient.set(`bl_${accessToken}`, 'true', 'EX', 15 * 60);
    }
    if (userId) {
      await redisClient.del(`rt_${userId}`);
    }
  }

  async refresh(refreshToken: string) {
    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET) as jwt.JwtPayload;
    } catch {
      throw new AuthError(401, 'Refresh token expired or invalid');
    }

    const storedToken = await redisClient.get(`rt_${decoded.sub}`);
    if (storedToken !== refreshToken) {
      throw new AuthError(401, 'Invalid or revoked refresh token');
    }

    const user = await this.userRepo.findById(Number(decoded.sub));
    if (!user) {
      throw new AuthError(401, 'User no longer exists');
    }

    const accessToken = jwt.sign({ sub: user.id, role: user.role }, ACCESS_SECRET, {
      expiresIn: '15m'
    });
    return { accessToken };
  }

  async register(data: RegisterInput): Promise<users> {
    const isLibrarian = !!data.librarianCode && !!LIBRARIAN_SIGNUP_CODE && data.librarianCode === LIBRARIAN_SIGNUP_CODE;

    // The roster only covers students; librarian signups authenticate via
    // the access code instead and skip student verification entirely.
    if (!isLibrarian) {
      if (!data.studentId || !data.indexNumber) {
        throw new AuthError(400, 'Student ID and Index Number are required.');
      }
      const isValidStudent = await this.userService.verifyRoster(data.studentId, data.indexNumber);
      if (!isValidStudent) {
        throw new AuthError(400, 'Roster verification failed. Invalid Student ID or Index Number.');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const username = await generateUsernameFromName(data.name);

    const newUser = await this.userRepo.create({
      username,
      password: hashedPassword,
      role: isLibrarian ? 'librarian' : 'member',
      name: data.name,
      email: data.email,
      student_id: data.studentId,
      index_number: data.indexNumber,
      is_verified: 0,
      verification_token: verifyToken
    });

    await this.emailService.queueVerificationEmail(newUser.email, newUser.name, verifyToken);

    return newUser;
  }

  async verifyEmail(token: string) {
    const user = await prisma.users.findFirst({ where: { verification_token: token } });
    if (!user) {
      throw new AuthError(400, 'Invalid verification token');
    }

    await this.userRepo.update(user.id, { is_verified: 1, verification_token: null });
  }

  async forgotPassword(email: string) {
    const user = await prisma.users.findFirst({ where: { email } });
    if (!user) {
      // Caller returns the same message regardless, to prevent email enumeration.
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepo.update(user.id, { reset_token: resetToken, reset_token_expiry: expiry });

    await this.emailService.queueResetPasswordEmail(user.email, user.name, resetToken);
  }

  async resetPassword(token: string, password: string) {
    const user = await prisma.users.findFirst({
      where: {
        reset_token: token,
        reset_token_expiry: { gte: new Date() }
      }
    });
    if (!user) {
      throw new AuthError(400, 'Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepo.update(user.id, {
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null
    });
  }
}
