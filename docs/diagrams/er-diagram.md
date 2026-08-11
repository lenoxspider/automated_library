# Entity-Relationship Diagram — SmartLib

Generated directly from `prisma/schema.prisma` (the real, current schema — not
a design sketch). Renders natively on GitHub; paste into any Mermaid-aware
tool (draw.io import, Mermaid Live Editor) to export as PNG/SVG for a report
or slide deck.

```mermaid
erDiagram
    users ||--o{ borrowings : "borrows"
    users ||--o{ reservations : "places"
    books ||--o{ book_copies : "has copies"
    books ||--o{ reservations : "is reserved via"
    book_copies ||--o{ borrowings : "is borrowed as"
    borrowings ||--o| fines : "may incur"

    users {
        int id PK
        string username UK
        string password
        string role
        string name
        string email
        int is_verified
        string verification_token
        string student_id
        string index_number
        string reset_token
        string reset_token_expiry
        string account_status
    }

    books {
        int id PK
        string title
        string author
        string genre
        string isbn UK
        int total_copies
        int available_copies
        string cover_path
    }

    book_copies {
        int id PK
        int book_id FK
        string barcode UK
        string status
    }

    borrowings {
        int id PK
        int copy_id FK
        int member_id FK
        string borrow_date
        string due_date
        string return_date
        string status
    }

    fines {
        int id PK
        int borrowing_id FK, UK
        float amount
        string status
        string payment_date
    }

    reservations {
        int id PK
        int book_id FK
        int member_id FK
        string reservation_date
        string status
    }

    library_settings {
        string key PK
        string value
    }

    student_roster {
        int id PK
        string name
        string student_id UK
        string index_number UK
    }

    site_visits {
        int id PK
        string visit_time
    }
```

## Notes on the actual schema (not idealized)

- **`library_settings`, `student_roster`, and `site_visits` have no foreign
  keys** — they're independent lookup/log tables, not connected to the rest
  of the model. `student_roster` is used only during registration to verify
  a claimed Student ID + Index Number pair; it isn't linked to `users` by a
  foreign key, only compared at application level in
  `src/services/user.service.ts`.
- **`fines` is 1:0..1 with `borrowings`** (a `@unique` on `borrowing_id`) —
  a borrowing can have at most one fine record, which is upserted (not
  duplicated) as days-overdue accrues.
- **Normalization**: all tables are in 3NF — every non-key attribute depends
  on the whole primary key and nothing but the key (e.g. `available_copies`
  on `books` is a derived/cached count rather than being computed by
  counting `book_copies` per request, which is a deliberate
  denormalization for read performance, not a normalization violation of
  the schema itself).
