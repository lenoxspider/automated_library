# SmartLib - Automated Library System

SmartLib is a responsive, full-stack library management system designed for academic evaluation. Built using **Node.js (Express)**, and a persistent **SQLite3** database, it provides role-based workspaces for Administrators, Librarians, and Members (Students/Staff) without any reliance on mock data seeds.

## 🚀 Key Features

- **Dynamic Role-Based Access Control**:
  - **Administrator**: User account registers, system analytics, and data exportation.
  - **Librarian**: Book inventory management, checkout desk (Issuing & Returns), reservation queue approvals, and fine collections.
  - **Member (Student/Staff)**: Book search catalog with live availability indicators, advanced reservations, active loans log, and personal fine ledger.
- **Automated Fine Calculations**: Fines are automatically calculated upon return if a book is returned after its due date ($1.00 per day).
- **Interactive Visuals**: Includes live dashboards mapping borrow trends and popular books (built using Chart.js).
- **No Mock Data**: Initialized clean. Supports account creation directly from the landing page.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: Single Page Application (SPA) powered by vanilla HTML5, CSS3 (Light/Dark themes), and JavaScript (ES6+).

---

## 💻 How to Install and Run

### 1. Prerequisites
Ensure you have **Node.js** (v16+) installed. You can check your version using:
```bash
node -v
```

### 2. Install Project Dependencies
Navigate to the project root and run:
```bash
npm install
```

This will install `express` and rebuild `sqlite3` for your local environment.

### 3. Launch the Application Server
Run the Express server:
```bash
node server.js
```

Upon starting, the server will output:
```text
Connected to SQLite database at: .../librarySys/library.db
Default admin account created: admin / admin123
Database tables verified/created successfully.
SmartLib server is running on http://localhost:3000
```

### 4. Access the Web Application
Open your web browser and navigate to:
```text
http://localhost:3000
```

---

## 🔐 Default Accounts for Testing

Because the database initializes without mock content, a default administrator account is generated to provide a system entry point:

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Administrator

---

## 🔍 How to Inspect the Database

The database is stored in a single file: `library.db` in your root folder.

Your lecturer can inspect the tables and records in three ways:

1. **DB Browser for SQLite (GUI Desktop App)**:
   - Download the free [DB Browser for SQLite](https://sqlitebrowser.org/).
   - Click "Open Database" and select the `library.db` file.
   - Go to the **Browse Data** tab to view the tables (users, books, borrowings, reservations, fines).
2. **VS Code Extensions (Editor GUI)**:
   - Install the **"SQLite Viewer"** extension in VS Code.
   - Simply click on `library.db` in the VS Code explorer to browse the database directly inside the editor.
3. **SQLite CLI (Command Line)**:
   - Run the command line tool:
     ```bash
     sqlite3 library.db
     ```
   - Run SQL queries directly, e.g.:
     ```sql
     .tables
     SELECT * FROM users;
     ```

---

## 📂 System Design Specifications
Comprehensive system documentation including Entity-Relationship Diagrams (ERD) and Data Flow Diagrams (DFD Level 0) is available in [SYSTEM_DOCS.md](SYSTEM_DOCS.md).
