const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./library.db');

async function seed() {
  const hash = await bcrypt.hash('password123', 10);
  
  db.serialize(() => {
    db.run(`DELETE FROM users`);
    
    const stmt = db.prepare(`INSERT INTO users (username, password, role, name, email, is_verified) VALUES (?, ?, ?, ?, ?, ?)`);
    
    stmt.run('admin@library.com', hash, 'admin', 'System Admin', 'admin@library.com', 1);
    stmt.run('librarian@library.com', hash, 'librarian', 'Head Librarian', 'librarian@library.com', 1);
    stmt.run('member@library.com', hash, 'member', 'John Doe', 'member@library.com', 1);
    
    stmt.finalize();
  });
  
  db.close((err) => {
    if (err) console.error(err);
    else console.log('Seed completed successfully via raw SQLite.');
  });
}

seed();
