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
const baseTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'base.hbs'), 'utf8'));
const verifyBody = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'verify.hbs'), 'utf8'));
const reminderBody = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'reminder.hbs'), 'utf8'));
const overdueBody = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'overdue.hbs'), 'utf8'));

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
