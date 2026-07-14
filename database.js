const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, process.env.DATABASE_FILE || 'library.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeSchema();
  }
});

function initializeSchema() {
  db.serialize(() => {
    // 1. Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL, -- 'admin', 'librarian', 'member'
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        is_verified INTEGER DEFAULT 0,
        verification_token TEXT,
        student_id TEXT,
        index_number TEXT,
        reset_token TEXT,
        reset_token_expiry TEXT
      )
    `);

    // Alter table helper to add columns if they don't exist
    db.run("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0", (err) => {});
    db.run("ALTER TABLE users ADD COLUMN verification_token TEXT", (err) => {});
    db.run("ALTER TABLE users ADD COLUMN student_id TEXT", (err) => {});
    db.run("ALTER TABLE users ADD COLUMN index_number TEXT", (err) => {});
    db.run("ALTER TABLE users ADD COLUMN reset_token TEXT", (err) => {});
    db.run("ALTER TABLE users ADD COLUMN reset_token_expiry TEXT", (err) => {});

    // 2. Books Table
    db.run(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        genre TEXT NOT NULL,
        isbn TEXT UNIQUE NOT NULL,
        total_copies INTEGER NOT NULL DEFAULT 1,
        available_copies INTEGER NOT NULL DEFAULT 1
      )
    `);

    // 3. Borrowings Table
    db.run(`
      CREATE TABLE IF NOT EXISTS borrowings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        borrow_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        return_date TEXT,
        status TEXT NOT NULL DEFAULT 'borrowed', -- 'borrowed', 'returned', 'overdue'
        FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // 4. Reservations Table
    db.run(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        reservation_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'fulfilled', 'cancelled'
        FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // 5. Fines Table
    db.run(`
      CREATE TABLE IF NOT EXISTS fines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        borrowing_id INTEGER NOT NULL UNIQUE,
        amount REAL NOT NULL DEFAULT 0.0,
        status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'paid'
        payment_date TEXT,
        FOREIGN KEY (borrowing_id) REFERENCES borrowings (id) ON DELETE CASCADE
      )
    `);

    // 6. Site Visits Table for Traffic Analytics
    db.run(`
      CREATE TABLE IF NOT EXISTS site_visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visit_time TEXT NOT NULL
      )
    `);

    // 7. Student Roster Master Table
    db.run(`
      CREATE TABLE IF NOT EXISTS student_roster (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        student_id TEXT UNIQUE NOT NULL,
        index_number TEXT UNIQUE NOT NULL
      )
    `);

    // Migration statements for existing databases
    db.run("CREATE TABLE IF NOT EXISTS site_visits (id INTEGER PRIMARY KEY AUTOINCREMENT, visit_time TEXT NOT NULL)", (err) => {});
    db.run("CREATE TABLE IF NOT EXISTS student_roster (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, student_id TEXT UNIQUE NOT NULL, index_number TEXT UNIQUE NOT NULL)", (err) => {});

    // Create/Update the default administrator account, ensuring it is verified
    db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartlib.com';
      if (!row) {
        db.run(
          "INSERT INTO users (username, password, role, name, email, is_verified) VALUES (?, ?, ?, ?, ?, 1)",
          ["admin", "admin123", "admin", "System Administrator", adminEmail],
          (err) => {
            if (err) {
              console.error("Error creating default admin:", err.message);
            } else {
              console.log(`Default admin account created: admin / admin123 (${adminEmail})`);
            }
          }
        );
      } else {
        db.run(
          "UPDATE users SET email = ?, is_verified = 1 WHERE username = 'admin'",
          [adminEmail],
          (err) => {
            if (err) {
              console.error("Error updating admin verification:", err.message);
            } else {
              console.log(`Admin email updated and verified: ${adminEmail}`);
            }
          }
        );
      }
    });

    console.log('Database tables verified/created successfully.');
  });
}

module.exports = db;
