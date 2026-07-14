const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const TXT_PATH = path.join(__dirname, 'books_source.txt');
const DB_PATH = path.join(__dirname, 'library.db');

async function seed() {
    console.log('Opening database connection to:', DB_PATH);
    const db = new sqlite3.Database(DB_PATH);

    // Ensure books table exists
    await new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                genre TEXT NOT NULL,
                isbn TEXT UNIQUE NOT NULL,
                total_copies INTEGER NOT NULL DEFAULT 0,
                available_copies INTEGER NOT NULL DEFAULT 0
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    if (!fs.existsSync(TXT_PATH)) {
        console.error('ERROR: Source file books_source.txt does not exist at:', TXT_PATH);
        db.close();
        return;
    }

    console.log('Reading books_source.txt...');
    const data = fs.readFileSync(TXT_PATH, 'utf-8');
    const lines = data.split('\n');

    const books = [];
    // Skip header line (index 0)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(' | ');
        if (parts.length >= 5) {
            const title = parts[0].trim();
            const author = parts[1].trim();
            const genre = parts[2].trim();
            const isbn = parts[3].trim();
            const totalCopies = parseInt(parts[4].trim()) || 3;

            books.push({ title, author, genre, isbn, totalCopies });
        }
    }

    console.log(`Parsed ${books.length} books from books_source.txt.`);

    console.log('Inserting books into the database...');
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const stmt = db.prepare(`
            INSERT INTO books (title, author, genre, isbn, total_copies, available_copies)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(isbn) DO UPDATE SET
                total_copies = excluded.total_copies,
                available_copies = excluded.available_copies
        `);

        let count = 0;
        books.forEach(b => {
            stmt.run(b.title, b.author, b.genre, b.isbn, b.totalCopies, b.totalCopies, function(err) {
                if (err) {
                    console.error(`Failed to insert book ${b.title}:`, err.message);
                } else {
                    count++;
                }
            });
        });

        stmt.finalize(() => {
            db.run('COMMIT', (err) => {
                if (err) {
                    console.error('Transaction commit error:', err);
                } else {
                    db.get('SELECT COUNT(*) as count FROM books', [], (err, row) => {
                        console.log('==========================================');
                        console.log('BOOKS SEEDING COMPLETED!');
                        console.log(`Total books now in catalog: ${row ? row.count : 0}`);
                        console.log('==========================================');
                        db.close();
                    });
                }
            });
        });
    });
}

seed().catch(err => {
    console.error('Failed to seed books:', err);
});
