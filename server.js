const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();
const db = require('./database');

// Configure Nodemailer transporter using private env credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // false for 587, true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // avoids certificate validation issues
  }
});

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

function sendVerificationEmail(email, token, name) {
  const verificationLink = `${APP_URL}/api/auth/verify?token=${token}`;
  
  const mailOptions = {
    from: `"SmartLib Library" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Activate Your SmartLib Account',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #4f46e5; font-size: 28px; margin: 0; font-family: sans-serif;">SmartLib</h2>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Digital Library Management System</p>
        </div>
        <h3 style="color: #0f172a; font-size: 20px;">Welcome to SmartLib, ${name}!</h3>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Your student library account has been registered. Please activate your account by clicking the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Verify Email Address</a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">Or copy and paste this link into your browser address bar:</p>
        <p style="word-break: break-all; font-size: 13px;"><a href="${verificationLink}" style="color: #4f46e5;">${verificationLink}</a></p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">If you did not request this registration, please disregard this automated email.</p>
      </div>
    `
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Failed to send verification email to:', email, error.message);
        reject(error);
      } else {
        console.log('Verification email successfully sent to:', email, info.response);
        resolve(info);
      }
    });
  });
}

function sendResetEmail(email, token, name) {
  const resetLink = `${APP_URL}/reset?reset_token=${token}`;
  
  const mailOptions = {
    from: `"SmartLib Library" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset Your SmartLib Password',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #4f46e5; font-size: 28px; margin: 0; font-family: sans-serif;">SmartLib</h2>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Digital Library Management System</p>
        </div>
        <h3 style="color: #0f172a; font-size: 20px;">Hello, ${name}!</h3>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">We received a request to reset your SmartLib student account password. If you did not make this request, you can ignore this email.</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Click the button below to specify a new password. This recovery link is valid for 30 minutes:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">Or copy and paste this link into your browser address bar:</p>
        <p style="word-break: break-all; font-size: 13px;"><a href="${resetLink}" style="color: #4f46e5;">${resetLink}</a></p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">This is an automated security notification. Please do not reply directly.</p>
      </div>
    `
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Failed to send reset email to:', email, error.message);
        reject(error);
      } else {
        console.log('Reset email successfully sent to:', email, info.response);
        resolve(info);
      }
    });
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory session management
const sessions = {};

// Authentication Middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  const token = authHeader.split(' ')[1];
  const session = sessions[token];
  if (!session) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  req.user = session.user;
  next();
}

// Role authorization helper
function authorize(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
}

// Helper to check and update overdue status
function checkAndUpdateOverdue() {
  const today = new Date().toISOString().split('T')[0];
  db.serialize(() => {
    // Select all borrowed items that are overdue and update status
    db.run(
      `UPDATE borrowings 
       SET status = 'overdue' 
       WHERE status = 'borrowed' AND due_date < ?`,
      [today],
      function (err) {
        if (err) {
          if (!err.message.includes('no such table')) {
            console.error("Error updating overdue status:", err);
          }
        }
      }
    );

    // Auto-create unpaid fines for overdue books
    db.all(
      `SELECT b.id, b.due_date 
       FROM borrowings b
       LEFT JOIN fines f ON b.id = f.borrowing_id
       WHERE b.status = 'overdue' AND f.id IS NULL`,
      [],
      (err, rows) => {
        if (err) {
          if (!err.message.includes('no such table')) {
            console.error("Error selecting outstanding fines:", err);
          }
          return;
        }
        rows.forEach((row) => {
          const due = new Date(row.due_date);
          const now = new Date();
          const diffDays = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
          const fineAmount = Math.max(0, diffDays * 1.0);
          if (fineAmount > 0) {
            db.run(
              `INSERT OR IGNORE INTO fines (borrowing_id, amount, status) VALUES (?, ?, 'unpaid')`,
              [row.id, fineAmount]
            );
          }
        });
      }
    );
  });
}

// Regularly check for overdue borrowings
setInterval(checkAndUpdateOverdue, 30000); // every 30 seconds


// ==========================================
// AUTHENTICATION API
// ==========================================

// Verify Student ID & Index Number against master roster (Step 1)
app.post('/api/auth/verify-roster', (req, res) => {
  const { student_id, index_number } = req.body;
  if (!student_id || !index_number) {
    return res.status(400).json({ error: 'Student ID and Index Number are required.' });
  }

  // 1. Check if user is already registered in users table
  db.get(`SELECT id FROM users WHERE student_id = ?`, [student_id], (err, existingUser) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existingUser) {
      return res.status(400).json({ error: 'An account has already been registered with this Student ID.' });
    }

    // 2. Query roster
    db.get(
      `SELECT name FROM student_roster WHERE student_id = ? AND index_number = ?`,
      [student_id, index_number],
      (err, student) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!student) {
          return res.status(400).json({ error: 'Student details not found in the official university roster.' });
        }
        res.json({ message: 'Identity verified successfully.', name: student.name });
      }
    );
  });
});

// Register User (Admins and Librarians can create anyone; Members self-register via roster matching)
app.post('/api/auth/register', (req, res) => {
  const { username, password, role, name, email, student_id, index_number } = req.body;
  if (!username || !password || !role || !name || !email) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (/\d/.test(name)) {
    return res.status(400).json({ error: 'Full Name cannot contain numbers.' });
  }
  if (!email.toLowerCase().endsWith('@gmail.com')) {
    return res.status(400).json({ error: 'Only Gmail addresses (@gmail.com) are accepted.' });
  }

  // Helper function to proceed with user insertion
  const proceedWithRegister = (finalName) => {
    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    db.run(
      `INSERT INTO users (username, password, role, name, email, verification_token, is_verified, student_id, index_number) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [username, password, role, finalName, email, verificationToken, student_id || null, index_number || null],
      async function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username is already taken.' });
          }
          return res.status(500).json({ error: err.message });
        }

        const userId = this.lastID;

        try {
          await sendVerificationEmail(email, verificationToken, finalName);
          res.status(201).json({ message: 'Registration successful. A verification email has been sent.' });
        } catch (emailError) {
          db.run(`DELETE FROM users WHERE id = ?`, [userId], (delErr) => {
            if (delErr) console.error("Error rolling back user registration:", delErr);
            res.status(500).json({ error: `Registration failed. Could not send verification email: ${emailError.message}` });
          });
        }
      }
    );
  };

  if (role === 'member') {
    if (!student_id || !index_number) {
      return res.status(400).json({ error: 'Student ID and Index Number are required for students.' });
    }
    // Re-verify roster on registration to prevent API bypass
    db.get(
      `SELECT name FROM student_roster WHERE student_id = ? AND index_number = ?`,
      [student_id, index_number],
      (err, student) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!student) {
          return res.status(400).json({ error: 'Student details not found on the roster.' });
        }
        // Force database record to use the clean roster name
        proceedWithRegister(student.name);
      }
    );
  } else {
    // Librarians / Admins registered directly
    proceedWithRegister(name);
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  db.get(
    `SELECT * FROM users WHERE username = ? AND password = ?`,
    [username, password],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(400).json({ error: 'Invalid username or password.' });
      }
      if (user.is_verified === 0) {
        return res.status(400).json({ error: 'Please verify your email address before logging in.' });
      }

      // Generate simple session token
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessions[token] = {
        user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email },
        createdAt: Date.now()
      };

      res.json({ token, user: sessions[token].user });
    }
  );
});

// Request Password Reset
app.post('/api/auth/forgot-password', (req, res) => {
  const { student_id, index_number } = req.body;
  if (!student_id || !index_number) {
    return res.status(400).json({ error: 'Student ID and Index Number are required.' });
  }

  // Find user by student_id and index_number
  db.all(
    `SELECT * FROM users WHERE student_id = ? AND index_number = ?`,
    [student_id, index_number],
    async (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) {
        return res.status(400).json({ error: 'No account found matching this Student ID and Index Number.' });
      }
      if (rows.length > 1) {
        return res.status(400).json({ error: 'Multiple accounts match this criteria. Please contact support.' });
      }

      const user = rows[0];
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

      db.run(
        `UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?`,
        [token, expiry, user.id],
        async function (updateErr) {
          if (updateErr) return res.status(500).json({ error: updateErr.message });
          
          try {
            await sendResetEmail(user.email, token, user.name);
            res.json({ message: 'Password recovery email has been sent successfully.' });
          } catch (emailErr) {
            res.status(500).json({ error: `Could not send recovery email: ${emailErr.message}` });
          }
        }
      );
    }
  );
});

// Verify Reset Token (used on SPA load)
app.get('/api/auth/verify-reset-token', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Reset token is required.' });

  const now = new Date().toISOString();
  db.get(
    `SELECT email, name FROM users WHERE reset_token = ? AND reset_token_expiry > ?`,
    [token, now],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
      
      // Mask email for privacy (e.g. da***i79@gmail.com)
      const parts = user.email.split('@');
      const emailUser = parts[0];
      const emailDomain = parts[1];
      const maskedUser = emailUser.length > 3 
        ? emailUser.substring(0, 2) + '*'.repeat(emailUser.length - 3) + emailUser.slice(-1) 
        : emailUser[0] + '*';
      const maskedEmail = `${maskedUser}@${emailDomain}`;

      res.json({ email: maskedEmail, name: user.name });
    }
  );
});

// Perform Password Reset
app.post('/api/auth/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  const now = new Date().toISOString();
  db.get(
    `SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > ?`,
    [token, now],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(400).json({ error: 'Reset link is invalid or has expired.' });

      db.run(
        `UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`,
        [password, user.id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ error: updateErr.message });
          res.json({ message: 'Password has been reset successfully.' });
        }
      );
    }
  );
});

// GET Email Verification
app.get('/api/auth/verify', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 100px; color: #ef4444;">Verification token is missing.</h1>');
  }

  db.get(`SELECT * FROM users WHERE verification_token = ?`, [token], (err, user) => {
    if (err) return res.status(500).send('<h1>Server Error during verification.</h1>');
    if (!user) {
      return res.status(400).send(`
        <div style="font-family: 'Segoe UI', sans-serif; text-align: center; margin-top: 100px; padding: 20px;">
          <h1 style="color: #ef4444;">Verification Failed</h1>
          <p style="color: #64748b; font-size: 16px;">The verification link is invalid, expired, or has already been used.</p>
          <a href="/" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-top: 20px;">Go to Login</a>
        </div>
      `);
    }

    db.run(
      `UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?`,
      [user.id],
      (err) => {
        if (err) return res.status(500).send('<h1>Failed to update verification status.</h1>');
        res.send(`
          <div style="font-family: 'Segoe UI', sans-serif; text-align: center; margin-top: 100px; padding: 20px;">
            <div style="color: #10b981; font-size: 64px; margin-bottom: 20px;">✓</div>
            <h1 style="color: #0f172a; font-size: 28px; margin-bottom: 10px;">Email Verified Successfully!</h1>
            <p style="color: #475569; font-size: 16px; margin-bottom: 30px;">Thank you, ${user.name}. Your account is now active and ready to log in.</p>
            <a href="/" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Login</a>
          </div>
        `);
      }
    );
  });
});

// Logout
app.post('/api/auth/logout', authenticate, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(' ')[1];
  delete sessions[token];
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Get current session
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});


// ==========================================
// BOOK MANAGEMENT API
// ==========================================

// Get all books with optional search query
app.get('/api/books', (req, res) => {
  const { search, random, limit } = req.query;
  let sql = 'SELECT * FROM books';
  let params = [];

  if (search) {
    sql += ' WHERE title LIKE ? OR author LIKE ? OR genre LIKE ? OR isbn LIKE ?';
    const queryParam = `%${search}%`;
    params = [queryParam, queryParam, queryParam, queryParam];
  } else if (random === 'true') {
    sql += ' ORDER BY RANDOM()';
  }

  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit, 10));
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a book (Librarian, Admin)
app.post('/api/books', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  const { title, author, genre, isbn, total_copies } = req.body;
  if (!title || !author || !genre || !isbn || total_copies === undefined) {
    return res.status(400).json({ error: 'All book details are required.' });
  }

  db.run(
    `INSERT INTO books (title, author, genre, isbn, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?)`,
    [title, author, genre, isbn, total_copies, total_copies],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'ISBN already exists.' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, title, author, genre, isbn, total_copies, available_copies: total_copies });
    }
  );
});

// Update a book (Librarian, Admin)
app.put('/api/books/:id', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  const { title, author, genre, isbn, total_copies } = req.body;
  const bookId = req.params.id;

  db.get(`SELECT * FROM books WHERE id = ?`, [bookId], (err, book) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!book) return res.status(404).json({ error: 'Book not found.' });

    // Calculate new available copies based on change in total_copies
    const diff = total_copies - book.total_copies;
    const newAvailable = book.available_copies + diff;

    if (newAvailable < 0) {
      return res.status(400).json({ error: 'Total copies cannot be less than current checked out copies.' });
    }

    db.run(
      `UPDATE books 
       SET title = ?, author = ?, genre = ?, isbn = ?, total_copies = ?, available_copies = ? 
       WHERE id = ?`,
      [title, author, genre, isbn, total_copies, newAvailable, bookId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Book updated successfully.' });
      }
    );
  });
});

// Remove a book (Librarian, Admin)
app.delete('/api/books/:id', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  db.run(`DELETE FROM books WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Book deleted successfully.' });
  });
});


// ==========================================
// MEMBER & USER MANAGEMENT API
// ==========================================

// Get all users (Admin, Librarian)
app.get('/api/users', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  db.all(`SELECT id, username, role, name, email, student_id, index_number FROM users`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// View a member's full borrowing history
app.get('/api/users/:id/history', authenticate, (req, res) => {
  const userId = req.params.id;

  // Members can only see their own history, Admins/Librarians can see anyone's
  if (req.user.role === 'member' && req.user.id !== parseInt(userId)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  db.all(
    `SELECT b.id, b.borrow_date, b.due_date, b.return_date, b.status,
            bk.title, bk.author, bk.isbn,
            f.amount as fine_amount, f.status as fine_status
     FROM borrowings b
     JOIN books bk ON b.book_id = bk.id
     LEFT JOIN fines f ON b.id = f.borrowing_id
     WHERE b.member_id = ?
     ORDER BY b.borrow_date DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Delete a user (Admin only)
app.delete('/api/users/:id', authenticate, authorize(['admin']), (req, res) => {
  const userId = req.params.id;
  if (req.user.id === parseInt(userId)) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }

  db.run(`DELETE FROM users WHERE id = ?`, [userId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User account deleted successfully.' });
  });
});


// ==========================================
// BORROWING & RETURNS API
// ==========================================

// List all borrowings
app.get('/api/borrowings', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  db.all(
    `SELECT b.id, b.borrow_date, b.due_date, b.return_date, b.status,
            bk.title, bk.author, bk.isbn,
            u.name as member_name, u.email as member_email,
            f.amount as fine_amount, f.status as fine_status
     FROM borrowings b
     JOIN books bk ON b.book_id = bk.id
     JOIN users u ON b.member_id = u.id
     LEFT JOIN fines f ON b.id = f.borrowing_id
     ORDER BY b.borrow_date DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Issue a book (Librarian, Admin)
app.post('/api/borrowings', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  const { book_id, member_id, due_date } = req.body;
  if (!book_id || !member_id || !due_date) {
    return res.status(400).json({ error: 'Book, Member, and Due Date are required.' });
  }

  db.get(`SELECT * FROM books WHERE id = ?`, [book_id], (err, book) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!book) return res.status(404).json({ error: 'Book not found.' });
    if (book.available_copies <= 0) {
      return res.status(400).json({ error: 'No copies of this book are currently available.' });
    }

    db.get(`SELECT * FROM users WHERE id = ? AND role = 'member'`, [member_id], (err, member) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!member) return res.status(404).json({ error: 'Member not found.' });

      // Enforce borrowing policy rules
      db.all(`SELECT * FROM library_settings`, [], (err, settingsRows) => {
        if (err) return res.status(500).json({ error: err.message });

        const config = {};
        settingsRows.forEach(r => { config[r.key] = r.value; });

        const maxLoansLimit = parseInt(config.max_loans || '3', 10);
        const blockFinesEnabled = config.block_fines === '1';
        const blockOverdueEnabled = config.block_overdue === '1';

        db.all(`SELECT status FROM borrowings WHERE member_id = ? AND status IN ('borrowed', 'overdue')`, [member_id], (err, loans) => {
          if (err) return res.status(500).json({ error: err.message });

          if (loans.length >= maxLoansLimit) {
            return res.status(400).json({ error: `Checkout blocked: Member has reached maximum concurrent checkout limit of ${maxLoansLimit} books (Currently borrowing: ${loans.length}).` });
          }

          const hasOverdueLoans = loans.some(l => l.status === 'overdue');
          if (blockOverdueEnabled && hasOverdueLoans) {
            return res.status(400).json({ error: 'Checkout blocked: Member has overdue books that must be returned first.' });
          }

          db.get(
            `SELECT SUM(f.amount) as total 
             FROM fines f
             JOIN borrowings b ON f.borrowing_id = b.id
             WHERE b.member_id = ? AND f.status = 'unpaid'`,
            [member_id],
            (err, fineRow) => {
              if (err) return res.status(500).json({ error: err.message });

            const unpaidFinesTotal = fineRow && fineRow.total ? fineRow.total : 0;
            if (blockFinesEnabled && unpaidFinesTotal > 0) {
              return res.status(400).json({ error: `Checkout blocked: Member has unpaid outstanding fines total of $${unpaidFinesTotal.toFixed(2)}.` });
            }

            // Policy check passed -> Execute checkout
            const today = new Date().toISOString().split('T')[0];
            db.serialize(() => {
              db.run(
                `INSERT INTO borrowings (book_id, member_id, borrow_date, due_date, status) VALUES (?, ?, ?, ?, 'borrowed')`,
                [book_id, member_id, today, due_date],
                function (err) {
                  if (err) return res.status(500).json({ error: err.message });

                  db.run(
                    `UPDATE books SET available_copies = available_copies - 1 WHERE id = ?`,
                    [book_id],
                    (err) => {
                      if (err) console.error("Error decrementing book availability:", err);
                    }
                  );

                  db.run(
                    `UPDATE reservations 
                     SET status = 'fulfilled' 
                     WHERE book_id = ? AND member_id = ? AND status = 'pending'`,
                    [book_id, member_id]
                  );

                  res.json({ message: 'Book issued successfully.', borrowingId: this.lastID });
                }
              );
            });
          });
        });
      });
    });
  });
});

// Return a book (Librarian, Admin)
app.post('/api/borrowings/:id/return', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  const borrowingId = req.params.id;
  const today = new Date().toISOString().split('T')[0];

  db.get(`SELECT * FROM borrowings WHERE id = ?`, [borrowingId], (err, borrowing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!borrowing) return res.status(404).json({ error: 'Borrowing transaction not found.' });
    if (borrowing.return_date) return res.status(400).json({ error: 'Book already returned.' });

    const due = new Date(borrowing.due_date);
    const now = new Date();
    const diffDays = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
    const fineAmount = Math.max(0, diffDays * 1.0);

    db.serialize(() => {
      // Update borrowing record
      db.run(
        `UPDATE borrowings SET return_date = ?, status = 'returned' WHERE id = ?`,
        [today, borrowingId],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });

          // Increment book availability
          db.run(
            `UPDATE books SET available_copies = available_copies + 1 WHERE id = ?`,
            [borrowing.book_id]
          );

          // Calculate fine and create fine record if overdue
          if (fineAmount > 0) {
            db.run(
              `INSERT OR REPLACE INTO fines (borrowing_id, amount, status) VALUES (?, ?, 'unpaid')`,
              [borrowingId, fineAmount],
              (err) => {
                if (err) console.error("Error creating fine:", err);
              }
            );
            res.json({ message: 'Book returned with a late fine.', fineAmount });
          } else {
            res.json({ message: 'Book returned successfully. No fine.' });
          }
        }
      );
    });
  });
});


// ==========================================
// BOOK RESERVATIONS API
// ==========================================

// Get all reservations (Members see their own, Admin/Librarian see all)
app.get('/api/reservations', authenticate, (req, res) => {
  let sql = `
    SELECT r.id, r.reservation_date, r.status,
           bk.title, bk.author, bk.isbn, bk.available_copies,
           u.name as member_name, u.email as member_email, u.id as member_id
    FROM reservations r
    JOIN books bk ON r.book_id = bk.id
    JOIN users u ON r.member_id = u.id
  `;
  let params = [];

  if (req.user.role === 'member') {
    sql += ' WHERE r.member_id = ?';
    params = [req.user.id];
  }

  sql += ' ORDER BY r.reservation_date DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Reserve a book (Members can reserve)
app.post('/api/reservations', authenticate, (req, res) => {
  const { book_id } = req.body;
  const member_id = req.user.role === 'member' ? req.user.id : req.body.member_id;

  if (!book_id || !member_id) {
    return res.status(400).json({ error: 'Book and Member are required.' });
  }

  // Check if member already has a pending reservation for this book
  db.get(
    `SELECT * FROM reservations WHERE book_id = ? AND member_id = ? AND status = 'pending'`,
    [book_id, member_id],
    (err, reservation) => {
      if (err) return res.status(500).json({ error: err.message });
      if (reservation) {
        return res.status(400).json({ error: 'You already have a pending reservation for this book.' });
      }

      const today = new Date().toISOString().split('T')[0];
      db.run(
        `INSERT INTO reservations (book_id, member_id, reservation_date, status) VALUES (?, ?, ?, 'pending')`,
        [book_id, member_id, today],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Book reserved successfully.', reservationId: this.lastID });
        }
      );
    }
  );
});

// Cancel a reservation
app.post('/api/reservations/:id/cancel', authenticate, (req, res) => {
  const reservationId = req.params.id;

  db.get(`SELECT * FROM reservations WHERE id = ?`, [reservationId], (err, resv) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!resv) return res.status(404).json({ error: 'Reservation not found.' });

    // Members can only cancel their own reservations
    if (req.user.role === 'member' && resv.member_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    db.run(
      `UPDATE reservations SET status = 'cancelled' WHERE id = ?`,
      [reservationId],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Reservation cancelled successfully.' });
      }
    );
  });
});


// ==========================================
// FINE MANAGEMENT API
// ==========================================

// Get all fines
app.get('/api/fines', authenticate, (req, res) => {
  let sql = `
    SELECT f.id, f.amount, f.status, f.payment_date,
           bk.title,
           u.name as member_name, u.email as member_email, u.id as member_id
    FROM fines f
    JOIN borrowings b ON f.borrowing_id = b.id
    JOIN books bk ON b.book_id = bk.id
    JOIN users u ON b.member_id = u.id
  `;
  let params = [];

  if (req.user.role === 'member') {
    sql += ' WHERE b.member_id = ?';
    params = [req.user.id];
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Record fine payment (Librarian, Admin)
app.post('/api/fines/:id/pay', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  const fineId = req.params.id;
  const today = new Date().toISOString().split('T')[0];

  db.run(
    `UPDATE fines SET status = 'paid', payment_date = ? WHERE id = ?`,
    [today, fineId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Fine payment recorded successfully.' });
    }
  );
});


// ==========================================
// REPORTS & DASHBOARD API
// ==========================================

// Record a site visit/telemetry event
app.post('/api/analytics/visit', (req, res) => {
  const now = new Date().toISOString();
  db.run(`INSERT INTO site_visits (visit_time) VALUES (?)`, [now], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Get classmate enrollment roster audit report
app.get('/api/reports/roster-audit', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  db.get(`SELECT COUNT(*) as total FROM student_roster`, [], (err, totalRow) => {
    if (err) return res.status(500).json({ error: err.message });
    const total = totalRow ? totalRow.total : 0;

    db.get(`SELECT COUNT(*) as registered FROM users WHERE student_id IS NOT NULL`, [], (err, regRow) => {
      if (err) return res.status(500).json({ error: err.message });
      const registered = regRow ? regRow.registered : 0;
      const unregistered = Math.max(0, total - registered);
      const percentage = total > 0 ? ((registered / total) * 100).toFixed(1) : '0.0';

      db.all(
        `SELECT sr.name, sr.student_id, sr.index_number,
                (CASE WHEN u.id IS NOT NULL THEN 'registered' ELSE 'unregistered' END) as status,
                u.email, u.username
         FROM student_roster sr
         LEFT JOIN users u ON sr.student_id = u.student_id
         ORDER BY sr.name ASC`,
        [],
        (err, roster) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({
            stats: { total, registered, unregistered, percentage },
            roster
          });
        }
      );
    });
  });
});

// GET library policy settings
app.get('/api/settings', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  db.all(`SELECT * FROM library_settings`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  });
});

// PUT library policy settings
app.put('/api/settings', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  const { max_loans, block_fines, block_overdue } = req.body;
  
  db.serialize(() => {
    if (max_loans !== undefined) {
      db.run(`UPDATE library_settings SET value = ? WHERE key = 'max_loans'`, [max_loans.toString()]);
    }
    if (block_fines !== undefined) {
      db.run(`UPDATE library_settings SET value = ? WHERE key = 'block_fines'`, [block_fines ? '1' : '0']);
    }
    if (block_overdue !== undefined) {
      db.run(`UPDATE library_settings SET value = ? WHERE key = 'block_overdue'`, [block_overdue ? '1' : '0']);
    }
  });
  
  res.json({ message: 'Library policy settings saved successfully.' });
});

// GET currently blocked members report
app.get('/api/reports/blocked-members', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  db.all(`SELECT * FROM library_settings`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const config = {};
    rows.forEach(r => { config[r.key] = r.value; });
    
    const maxLoansLimit = parseInt(config.max_loans || '3', 10);
    const blockFinesEnabled = config.block_fines === '1';
    const blockOverdueEnabled = config.block_overdue === '1';
    
    db.all(`SELECT id, name, email, student_id, index_number FROM users WHERE role = 'member'`, [], (err, members) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const blockedList = [];
      let pendingChecks = members.length;
      let hasErrored = false;
      
      if (pendingChecks === 0) {
        return res.json([]);
      }
      
      members.forEach(member => {
        db.all(`SELECT status FROM borrowings WHERE member_id = ? AND status IN ('borrowed', 'overdue')`, [member.id], (err, loans) => {
          if (hasErrored) return;
          if (err) {
            hasErrored = true;
            return res.status(500).json({ error: err.message });
          }
          
          const activeLoansCount = loans.length;
          const hasOverdueLoans = loans.some(l => l.status === 'overdue');
          
          db.get(
            `SELECT SUM(f.amount) as total 
             FROM fines f
             JOIN borrowings b ON f.borrowing_id = b.id
             WHERE b.member_id = ? AND f.status = 'unpaid'`,
            [member.id],
            (err, fineRow) => {
              if (hasErrored) return;
              if (err) {
                hasErrored = true;
                return res.status(500).json({ error: err.message });
              }
              
              const unpaidFinesTotal = fineRow && fineRow.total ? fineRow.total : 0;
              const violations = [];
              
              if (activeLoansCount >= maxLoansLimit) {
                violations.push(`Max borrowings reached (${activeLoansCount} of max ${maxLoansLimit})`);
              }
              if (blockOverdueEnabled && hasOverdueLoans) {
                violations.push('Has active overdue books');
              }
              if (blockFinesEnabled && unpaidFinesTotal > 0) {
                violations.push(`Has unpaid fines ($${unpaidFinesTotal.toFixed(2)})`);
              }
              
              if (violations.length > 0) {
                blockedList.push({
                  member_id: member.id,
                  name: member.name,
                  email: member.email,
                  student_id: member.student_id,
                  index_number: member.index_number,
                  violations
                });
              }
              
              pendingChecks--;
              if (pendingChecks === 0) {
                res.json(blockedList);
              }
            }
          );
        });
      });
    });
  });
});

// Get Daily Shift Circulation Log report
app.get('/api/reports/circulation-log', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  db.all(
    `SELECT b.id, b.borrow_date, b.due_date, b.return_date, b.status,
            u.name as member_name, u.email as member_email,
            bk.title as book_title, bk.isbn
     FROM borrowings b
     JOIN users u ON b.member_id = u.id
     JOIN books bk ON b.book_id = bk.id
     WHERE b.borrow_date = ? OR b.return_date = ?
     ORDER BY b.id DESC`,
    [today, today],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      let checkouts = 0;
      let returns = 0;
      
      rows.forEach(r => {
        if (r.borrow_date === today) checkouts++;
        if (r.return_date === today) returns++;
      });
      
      res.json({
        stats: { today, total: rows.length, checkouts, returns },
        log: rows
      });
    }
  );
});

// Get dashboard and analytics reports
app.get('/api/reports/dashboard', authenticate, authorize(['admin', 'librarian']), (req, res) => {
  const stats = {};
  
  db.get(`SELECT COUNT(*) as total FROM books`, [], (err, row) => {
    stats.totalBooks = row ? row.total : 0;
    
    db.get(`SELECT COUNT(*) as active FROM borrowings WHERE status = 'borrowed'`, [], (err, row) => {
      stats.activeBorrowings = row ? row.active : 0;

      db.get(`SELECT COUNT(*) as overdue FROM borrowings WHERE status = 'overdue'`, [], (err, row) => {
        stats.overdueBorrowings = row ? row.overdue : 0;

        db.get(`SELECT SUM(amount) as total FROM fines WHERE status = 'paid'`, [], (err, row) => {
          stats.totalFinesCollected = row && row.total ? row.total : 0;

          // Retrieve site visits stats
          db.get(`SELECT COUNT(*) as count FROM site_visits`, [], (err, row) => {
            stats.totalVisits = row ? row.count : 0;

            // Hourly visit traffic distribution
            db.all(
              `SELECT strftime('%H', visit_time) as hour, COUNT(*) as count 
               FROM site_visits 
               GROUP BY hour 
               ORDER BY hour ASC`,
              [],
              (err, hourlyVisits) => {
                stats.hourlyVisits = hourlyVisits || [];

                // Top 5 most borrowed books
                db.all(
                  `SELECT bk.title, COUNT(b.id) as count 
                   FROM borrowings b 
                   JOIN books bk ON b.book_id = bk.id 
                   GROUP BY b.book_id 
                   ORDER BY count DESC 
                   LIMIT 5`,
                  [],
                  (err, topBooks) => {
                    stats.topBooks = topBooks || [];

                    // Monthly borrowing trends
                    db.all(
                      `SELECT strftime('%Y-%m', borrow_date) as month, COUNT(id) as count 
                       FROM borrowings 
                       GROUP BY month 
                       ORDER BY month DESC 
                       LIMIT 6`,
                      [],
                      (err, trends) => {
                        stats.borrowingTrends = trends ? trends.reverse() : [];
                        res.json(stats);
                      }
                    );
                  }
                );
              }
            );
          });
        });
      });
    });
  });
});


// Serve Multi-Page Application routing structures
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/reset', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset.html'));
});

// Fallback redirect for other routes
app.use((req, res) => {
  res.redirect('/');
});

// Run server
app.listen(PORT, () => {
  console.log(`SmartLib server is running on http://localhost:${PORT}`);
  checkAndUpdateOverdue(); // Run initial status check
});
