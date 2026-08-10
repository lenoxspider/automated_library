# SmartLib - Current Feature List

This document serves as a baseline record of all features currently implemented in the monolithic version of the application. It can be used to ensure no functionality is lost during the refactoring process.

## 1. Authentication & User Management
- **Roster Verification:** Students must verify their identity against a pre-loaded `student_roster` (Student ID & Index Number) before registering.
- **User Registration:**
  - Members self-register after roster verification.
  - Admins and Librarians can manually register new staff/users.
- **Login & Sessions:** Token-based authentication using in-memory sessions.
- **Account Recovery:** Forgot password and Reset password flows with email links.
- **Email Verification:** Sends automated verification emails via Nodemailer.
- **Role-Based Access Control (RBAC):** Three distinct roles (`admin`, `librarian`, `member`) restricting access to specific routes and actions.
- **User Directory:** View all registered users and their history.
- **User Deletion:** Admins can delete users.

## 2. Book & Inventory Management
- **Book Catalog:** Add, edit, and delete book metadata (Title, Author, Genre, ISBN).
- **Item-Level Tracking:** Add specific physical copies of a book, each with a unique barcode.
- **Copy Statuses:** Tracks whether a specific copy is 'Available', 'Checked Out', 'Lost', 'Damaged', or 'Reserved'.

## 3. Circulation (Borrowing & Returning)
- **Checkouts (Borrowing):** Librarians can issue a book copy to a member.
- **Returns:** Librarians can process returned books.
- **Policy Enforcement:** Automatically blocks members from borrowing if they exceed the maximum allowed loans, have unpaid fines, or have overdue books (based on settings).

## 4. Reservations (Holds)
- **Place Holds:** Members can reserve books that are currently unavailable.
- **Cancel Holds:** Members can cancel their pending reservations.

## 5. Fines & Penalties
- **Fine Accrual:** Automatically tracks fines for overdue books.
- **Fine Payment:** Librarians can process and mark fines as paid.

## 6. Library Settings & Policies
- **Dynamic Configuration:** Admins can update global policies without restarting the server:
  - `max_loans`: Maximum number of books a member can borrow simultaneously.
  - `block_fines`: Boolean toggle to block users with unpaid fines from borrowing.
  - `block_overdue`: Boolean toggle to block users with overdue books from borrowing.

## 7. Reporting & Analytics
- **Dashboard Overview:** High-level statistics for admins/librarians.
- **Circulation Log:** A detailed history of all borrows and returns.
- **Blocked Members Report:** Lists members who are currently restricted from borrowing and the reason why.
- **Roster Audit:** Compares registered users against the master student roster to find discrepancies.
- **Custom Queries:** A specialized endpoint for admins to run specific reporting queries.
- **Traffic Analytics:** Tracks basic site visits.

## 8. Automated Background Tasks (Cron Jobs)
- **Overdue Processing:** A scheduled `node-cron` job that runs automatically to flag overdue accounts and generate fines.
- **Manual Trigger:** An endpoint for admins to force the execution of the cron job for testing/immediate processing.
