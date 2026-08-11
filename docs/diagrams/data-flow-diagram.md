# Data Flow Diagram — SmartLib

Two levels, following standard DFD convention: rectangles are external
entities, rounded shapes are processes, cylinders are data stores.

## Level 0 — Context Diagram

```mermaid
flowchart LR
    Member[External Entity:\nMember]
    Librarian[External Entity:\nLibrarian]
    Admin[External Entity:\nAdmin]
    SMTP[External Entity:\nSMTP Email Provider]
    OpenLib[External Entity:\nOpenLibrary Cover API]

    System((("0\nSmartLib\nLibrary Management System")))

    Member <-->|"login, search, reserve"| System
    Librarian <-->|"checkout, return, approve holds"| System
    Admin <-->|"manage catalog, users, settings"| System
    System -->|"verification / reminder emails"| SMTP
    System -->|"ISBN cover lookup"| OpenLib
    OpenLib -->|"cover image"| System
```

## Level 1 — Major Processes

```mermaid
flowchart TB
    Member[Member]
    Librarian[Librarian]
    Admin[Admin]
    SMTP[SMTP Email Provider]
    OpenLib[OpenLibrary API]
    Cron{{Scheduled Cron Job}}

    P1((1.0\nManage\nAuthentication))
    P2((2.0\nManage\nCatalog))
    P3((3.0\nManage\nCirculation))
    P4((4.0\nManage\nReservations))
    P5((5.0\nManage\nFines))
    P6((6.0\nGenerate\nReports))
    P7((7.0\nSend\nNotifications))

    D1[(D1: Users)]
    D2[(D2: Books & Copies)]
    D3[(D3: Borrowings)]
    D4[(D4: Fines)]
    D5[(D5: Reservations)]
    D6[(D6: Settings)]
    D7[(D7: Student Roster)]

    Member -->|credentials, registration| P1
    P1 <-->|user record| D1
    P1 -->|roster check| D7
    P1 -->|verification token| P7

    Member -->|search terms| P2
    Librarian -->|add/edit book| P2
    Admin -->|delete book| P2
    P2 <-->|book/copy data| D2
    P2 -->|cover fetch| OpenLib

    Librarian -->|copy ID, member ID| P3
    P3 <-->|loan record| D3
    P3 -->|copy status update| D2
    P3 -->|triggers on return| P5

    Member -->|reserve/cancel| P4
    Librarian -->|approve/decline| P4
    P4 <-->|reservation record| D5
    P4 -->|book availability check| D2

    P3 -->|overdue loan| P5
    Librarian -->|pay fine| P5
    P5 <-->|fine record| D4
    P5 -->|fine rate lookup| D6

    Cron -->|daily trigger| P5
    Cron -->|daily trigger| P7
    Librarian -->|request report| P6
    Admin -->|request report| P6
    P6 -->|read| D3
    P6 -->|read| D4
    P6 -->|read| D1
    P6 -->|read| D7

    P1 -->|queue email| P7
    P5 -->|queue reminder| P7
    P7 -->|send| SMTP
```

## Notes

- **Process 7.0 (Send Notifications)** is fed by two sources: account
  verification (from 1.0, on register) and fine/reminder emails (from 5.0,
  triggered daily by the cron job in `src/services/cron.service.ts`) — this
  reflects the actual notification feature added this session
  (`EmailService.queueDueSoonReminder` / `queueOverdueReminder`).
- **Process 3.0 (Manage Circulation)** feeding into **5.0 (Manage Fines)**
  reflects that returning an overdue book calculates a fine synchronously
  (`CirculationService.returnBook`), separately from the daily cron batch
  that updates fines for books still out.
- Data store reads for 6.0 (Reports) are read-only — reports never write
  back to D1/D3/D4/D7, matching `src/controllers/reports.controller.ts`.
