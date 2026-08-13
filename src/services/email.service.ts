import { Queue, Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import redisClient from '../config/redis';
import { injectable } from 'tsyringe';
import fs from 'fs';
import path from 'path';
import os from 'os';

function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Load templates once
const templateDir = path.join(process.cwd(), 'templates', 'email');
const baseTemplate = Handlebars.compile(
  fs.readFileSync(path.join(templateDir, 'base.hbs'), 'utf8')
);
const verifyBody = Handlebars.compile(
  fs.readFileSync(path.join(templateDir, 'verify.hbs'), 'utf8')
);
const reminderBody = Handlebars.compile(
  fs.readFileSync(path.join(templateDir, 'reminder.hbs'), 'utf8')
);
const overdueBody = Handlebars.compile(
  fs.readFileSync(path.join(templateDir, 'overdue.hbs'), 'utf8')
);
const resetBody = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'reset.hbs'), 'utf8'));
const readyBody = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'ready.hbs'), 'utf8'));

@injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private emailQueue: Queue;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.office365.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Create a BullMQ Queue
    this.emailQueue = new Queue('email-queue', { connection: redisClient as any });

    // Create a Worker to process jobs
    new Worker(
      'email-queue',
      async (job) => {
        const localIp = getLocalIpAddress();
        const baseUrl = `http://${localIp}:3000`;
        const unsubscribeUrl = `${baseUrl}/unsubscribe`;
        const year = new Date().getFullYear();

        if (job.name === 'sendVerification') {
          const { email, name, token } = job.data;
          const verificationLink = `${baseUrl}/verify?token=${token}`;
          const body = verifyBody({ name, verificationLink });
          const html = baseTemplate({ body, year, unsubscribeUrl });

          await this.transporter.sendMail({
            from: `"SmartLib" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Activate Your SmartLib Account',
            html
          });
        } else if (job.name === 'dueSoonReminder') {
          const { email, name, bookTitle, dueDate } = job.data;
          const body = reminderBody({ name, bookTitle, dueDate });
          const html = baseTemplate({ body, year, unsubscribeUrl });

          await this.transporter.sendMail({
            from: `"SmartLib" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Reminder: "${bookTitle}" is due soon`,
            html
          });
        } else if (job.name === 'overdueReminder') {
          const { email, name, bookTitle, dueDate, daysOverdue, fineAmount } = job.data;
          const body = overdueBody({ name, bookTitle, dueDate, daysOverdue, fineAmount });
          const html = baseTemplate({ body, year, unsubscribeUrl });

          await this.transporter.sendMail({
            from: `"SmartLib" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Overdue: "${bookTitle}"`,
            html
          });
        } else if (job.name === 'reservationReady') {
          const { email, name, bookTitle } = job.data;
          const body = readyBody({ name, bookTitle });
          const html = baseTemplate({ body, year, unsubscribeUrl });

          await this.transporter.sendMail({
            from: `"SmartLib" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `"${bookTitle}" is ready for pickup`,
            html
          });
        } else if (job.name === 'resetPassword') {
          const { email, name, token } = job.data;
          const resetLink = `${baseUrl}/reset-password?token=${token}`;
          const body = resetBody({ name, resetLink });
          const html = baseTemplate({ body, year, unsubscribeUrl });

          await this.transporter.sendMail({
            from: `"SmartLib" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Reset Your SmartLib Password',
            html
          });
        } else if (job.name === 'resetPasswordCode') {
          const { email, name, code } = job.data;
          const safeName = Handlebars.escapeExpression(name);
          const html =
            '<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1f2937">' +
            '<h2>Reset your SmartLib password</h2>' +
            '<p>Hello ' +
            safeName +
            ',</p>' +
            '<p>Use this verification code to continue resetting your password:</p>' +
            '<p style="font-size:30px;font-weight:700;letter-spacing:8px;color:#4f46e5">' +
            code +
            '</p>' +
            '<p>This code expires in 10 minutes. If you did not request a reset, you can ignore this email.</p>' +
            '<p>SmartLib</p></body></html>';
          await this.transporter.sendMail({
            from: '"SmartLib" <' + process.env.SMTP_USER + '>',
            to: email,
            subject: 'Your SmartLib password reset code',
            html
          });
        }
      },
      { connection: redisClient as any }
    );
  }

  async queueVerificationEmail(email: string, name: string, token: string) {
    await this.emailQueue.add('sendVerification', { email, name, token });
  }

  async queueDueSoonReminder(email: string, name: string, bookTitle: string, dueDate: string) {
    await this.emailQueue.add('dueSoonReminder', { email, name, bookTitle, dueDate });
  }

  async queueResetPasswordEmail(email: string, name: string, token: string) {
    await this.emailQueue.add('resetPassword', { email, name, token });
  }
  async queueResetPasswordCodeEmail(email: string, name: string, code: string) {
    await this.emailQueue.add('resetPasswordCode', { email, name, code });
  }

  async queueReservationReadyEmail(email: string, name: string, bookTitle: string) {
    await this.emailQueue.add('reservationReady', { email, name, bookTitle });
  }

  async queueOverdueReminder(
    email: string,
    name: string,
    bookTitle: string,
    dueDate: string,
    daysOverdue: number,
    fineAmount: number
  ) {
    await this.emailQueue.add('overdueReminder', {
      email,
      name,
      bookTitle,
      dueDate,
      daysOverdue,
      fineAmount: fineAmount.toFixed(2)
    });
  }
}
