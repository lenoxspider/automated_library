const cron = require('node-cron');
const db = require('./database');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

function sendAccountLockedEmail(email, name, bookTitle) {
  const mailOptions = {
    from: `"SmartLib Library" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Action Required: Library Account Locked',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #ef4444; font-size: 28px; margin: 0;">SmartLib Alert</h2>
        </div>
        <h3 style="color: #0f172a; font-size: 20px;">Hello ${name},</h3>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Your library account has been <strong>locked</strong> due to an overdue item: <em>${bookTitle}</em>.
        </p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Please return this item to the library immediately and pay any outstanding fines to restore your borrowing privileges.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard" style="background-color: #ef4444; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">View My Account</a>
        </div>
      </div>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Failed to send locked account email to:', email, error.message);
    } else {
      console.log('Locked account email sent to:', email);
    }
  });
}

function processOverdueAccounts() {
  console.log('Running nightly overdue account processor...');
  const today = new Date().toISOString().split('T')[0];

  const sql = `
    SELECT b.id as borrowing_id, b.due_date, bk.title, u.id as user_id, u.email, u.name, u.account_status
    FROM borrowings b
    JOIN books bk ON b.book_id = bk.id
    JOIN users u ON b.member_id = u.id
    WHERE b.status = 'borrowed' AND b.due_date < ?
  `;

  db.all(sql, [today], (err, rows) => {
    if (err) {
      console.error('Error fetching overdue accounts:', err.message);
      return;
    }

    if (rows.length === 0) {
      console.log('No new overdue accounts found today.');
      return;
    }

    rows.forEach(row => {
      // 1. Mark borrowing as overdue
      db.run(`UPDATE borrowings SET status = 'overdue' WHERE id = ?`, [row.borrowing_id], (err) => {
        if (err) console.error('Error updating borrowing status:', err.message);
      });

      // 2. Lock the user's account if not already locked
      if (row.account_status !== 'locked') {
        db.run(`UPDATE users SET account_status = 'locked' WHERE id = ?`, [row.user_id], (err) => {
          if (err) {
            console.error('Error locking user account:', err.message);
          } else {
            console.log(`Locked account for user ${row.user_id} (${row.name})`);
            // 3. Send email notification
            sendAccountLockedEmail(row.email, row.name, row.title);
          }
        });
      }
    });
  });
}

function initCronJobs() {
  // Run every midnight (0 0 * * *)
  cron.schedule('0 0 * * *', () => {
    processOverdueAccounts();
  });
  console.log('Cron jobs initialized: Overdue processor scheduled for midnight.');
}

module.exports = {
  initCronJobs,
  processOverdueAccounts // exported for manual triggering via force endpoint
};
