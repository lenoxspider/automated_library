import { Queue, Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import redisClient from '../config/redis';
import { injectable } from 'tsyringe';

// Define the templates for emails
const verificationTemplate = Handlebars.compile(`
  <div style="font-family: sans-serif; padding: 20px;">
    <h2>Welcome to SmartLib, {{name}}!</h2>
    <p>Please verify your email using the link below:</p>
    <a href="{{verificationLink}}" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none;">Verify Email</a>
  </div>
`);

const dueSoonTemplate = Handlebars.compile(`
  <div style="font-family: sans-serif; padding: 20px;">
    <h2>Reminder: "{{bookTitle}}" is due soon</h2>
    <p>Hi {{name}}, your loan of <strong>{{bookTitle}}</strong> is due on <strong>{{dueDate}}</strong>.</p>
    <p>Please return it by then to avoid a late fine.</p>
  </div>
`);

const overdueTemplate = Handlebars.compile(`
  <div style="font-family: sans-serif; padding: 20px;">
    <h2>Overdue: "{{bookTitle}}"</h2>
    <p>Hi {{name}}, your loan of <strong>{{bookTitle}}</strong> was due on <strong>{{dueDate}}</strong> and is now
    <strong>{{daysOverdue}} day(s) overdue</strong>.</p>
    <p>A fine of <strong>\${{fineAmount}}</strong> has been applied to your account. Please return the book as soon
    as possible.</p>
  </div>
`);

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
        if (job.name === 'sendVerification') {
          const { email, name, token } = job.data;
          const verificationLink = `${process.env.APP_URL}/api/auth/verify?token=${token}`;

          await this.transporter.sendMail({
            from: `"SmartLib" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Activate Your SmartLib Account',
            html: verificationTemplate({ name, verificationLink })
          });
        } else if (job.name === 'dueSoonReminder') {
          const { email, name, bookTitle, dueDate } = job.data;

          await this.transporter.sendMail({
            from: `"SmartLib" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Reminder: "${bookTitle}" is due soon`,
            html: dueSoonTemplate({ name, bookTitle, dueDate })
          });
        } else if (job.name === 'overdueReminder') {
          const { email, name, bookTitle, dueDate, daysOverdue, fineAmount } = job.data;

          await this.transporter.sendMail({
            from: `"SmartLib" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Overdue: "${bookTitle}"`,
            html: overdueTemplate({ name, bookTitle, dueDate, daysOverdue, fineAmount })
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
