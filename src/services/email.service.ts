import { Queue, Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import redisClient from '../config/redis';
import { injectable } from 'tsyringe';

// Define the template for emails
const verificationTemplate = Handlebars.compile(`
  <div style="font-family: sans-serif; padding: 20px;">
    <h2>Welcome to SmartLib, {{name}}!</h2>
    <p>Please verify your email using the link below:</p>
    <a href="{{verificationLink}}" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none;">Verify Email</a>
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
    new Worker('email-queue', async job => {
      if (job.name === 'sendVerification') {
        const { email, name, token } = job.data;
        const verificationLink = `${process.env.APP_URL}/api/auth/verify?token=${token}`;
        
        await this.transporter.sendMail({
          from: `"SmartLib" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Activate Your SmartLib Account',
          html: verificationTemplate({ name, verificationLink })
        });
      }
    }, { connection: redisClient as any });
  }

  async queueVerificationEmail(email: string, name: string, token: string) {
    await this.emailQueue.add('sendVerification', { email, name, token });
  }
}
