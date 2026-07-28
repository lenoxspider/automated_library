const db = require('./database');

console.log('Starting barcode migration...');

// Wait for database schema initialization
setTimeout(() => {
    db.serialize(() => {
        // Drop existing borrowings and fines to prevent referential errors
        console.log('Dropping old borrowings and fines...');
        db.run('DROP TABLE IF EXISTS fines');
        db.run('DROP TABLE IF EXISTS borrowings');

        // Recreate tables with correct schemas (this is mostly for forcing the DB to rebuild them since database.js already has the IF NOT EXISTS logic, we just run database.js's initialization again effectively)
        db.run(`
          CREATE TABLE IF NOT EXISTS borrowings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            copy_id INTEGER NOT NULL,
            member_id INTEGER NOT NULL,
            borrow_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            return_date TEXT,
            status TEXT NOT NULL DEFAULT 'borrowed',
            FOREIGN KEY (copy_id) REFERENCES book_copies (id) ON DELETE CASCADE,
            FOREIGN KEY (member_id) REFERENCES users (id) ON DELETE CASCADE
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS fines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            borrowing_id INTEGER NOT NULL UNIQUE,
            amount REAL NOT NULL DEFAULT 0.0,
            status TEXT NOT NULL DEFAULT 'unpaid',
            payment_date TEXT,
            FOREIGN KEY (borrowing_id) REFERENCES borrowings (id) ON DELETE CASCADE
          )
        `);

        // Generate barcodes for existing books
        db.all('SELECT id, total_copies FROM books', (err, books) => {
            if (err) {
                console.error('Error fetching books:', err.message);
                process.exit(1);
            }

            console.log(`Found ${books.length} books. Generating barcodes...`);
            let insertCount = 0;
            let expectedInserts = 0;

            const stmt = db.prepare('INSERT OR IGNORE INTO book_copies (book_id, barcode, status) VALUES (?, ?, ?)');

            books.forEach(book => {
                expectedInserts += book.total_copies;
                for (let i = 1; i <= book.total_copies; i++) {
                    const barcode = `LIB-${book.id.toString().padStart(4, '0')}-${i.toString().padStart(2, '0')}`;
                    stmt.run(book.id, barcode, 'Available', (err) => {
                        if (err) console.error('Error inserting barcode:', err.message);
                        insertCount++;
                        if (insertCount === expectedInserts) {
                            stmt.finalize();
                            console.log('Migration complete. Generated ' + insertCount + ' barcodes.');
                            process.exit(0);
                        }
                    });
                }
            });

            if (books.length === 0 || expectedInserts === 0) {
                console.log('No copies to migrate.');
                process.exit(0);
            }
        });
    });
}, 2000); // 2 second delay to let database.js init complete
