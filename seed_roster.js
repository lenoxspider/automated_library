const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Allows passing VCF path as command-line argument, defaults to local contacts.vcf or the local dev path
const VCF_PATH = process.argv[2] || 
                 (fs.existsSync(path.join(__dirname, 'contacts.vcf')) 
                    ? path.join(__dirname, 'contacts.vcf') 
                    : 'C:\\Users\\YOOF1337\\Downloads\\Telegram Desktop\\combined_contacts.vcf');
const DB_PATH = path.join(__dirname, 'library.db');

async function seed() {
    console.log('Opening database connection to:', DB_PATH);
    const db = new sqlite3.Database(DB_PATH);

    // Ensure table exists
    await new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS student_roster (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                student_id TEXT UNIQUE NOT NULL,
                index_number TEXT UNIQUE NOT NULL
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    console.log('Reading VCF file...');
    const vcfData = fs.readFileSync(VCF_PATH, 'utf-8');

    // Split cards by BEGIN:VCARD
    const cards = vcfData.split('BEGIN:VCARD');
    console.log(`Found ${cards.length - 1} potential contact cards.`);

    const students = [];

    for (const card of cards) {
        if (!card.trim()) continue;

        // Parse Name (FN)
        const fnMatch = card.match(/FN:(.+)/);
        const name = fnMatch ? fnMatch[1].trim() : null;

        // Parse NOTE line to extract Index Number and Student ID
        // Format example: NOTE:Group: Group1\nIndex Number: 6136124\nStudent ID: 21186730
        const noteMatch = card.match(/NOTE:(.+)/);
        let indexNumber = null;
        let studentId = null;

        if (noteMatch) {
            const noteContent = noteMatch[1].replace(/\\n/g, '\n');
            const idxMatch = noteContent.match(/Index Number:\s*(\d+)/i);
            const stdMatch = noteContent.match(/Student ID:\s*(\d+)/i);

            if (idxMatch) indexNumber = idxMatch[1].trim();
            if (stdMatch) studentId = stdMatch[1].trim();
        }

        if (name && studentId && indexNumber) {
            students.push({ name, studentId, indexNumber });
        }
    }

    console.log(`Parsed ${students.length} valid student records with both Student ID and Index Number.`);

    // Batch insert into database
    console.log('Inserting records into student_roster...');
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const stmt = db.prepare('INSERT OR IGNORE INTO student_roster (name, student_id, index_number) VALUES (?, ?, ?)');
        
        let insertedCount = 0;
        students.forEach(s => {
            stmt.run(s.name, s.studentId, s.indexNumber, function(err) {
                if (this.changes > 0) {
                    insertedCount++;
                }
            });
        });

        stmt.finalize(() => {
            db.run('COMMIT', (err) => {
                if (err) {
                    console.error('Failed to commit transaction:', err);
                } else {
                    // Check actual count in table
                    db.get('SELECT COUNT(*) as count FROM student_roster', [], (err, row) => {
                        console.log('==========================================');
                        console.log('SEEDING COMPLETED SUCCESSFULLY!');
                        console.log(`Total students now in roster: ${row ? row.count : 0}`);
                        console.log('==========================================');
                        db.close();
                    });
                }
            });
        });
    });
}

seed().catch(err => {
    console.error('Seeding process encountered an error:', err);
});
