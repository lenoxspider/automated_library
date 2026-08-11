import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';
import { Parser } from 'json2csv';

const sendReportResponse = (
  res: Response,
  data: any[],
  format: string | undefined,
  filename: string
) => {
  if (format === 'csv') {
    if (data.length === 0) {
      res.header('Content-Type', 'text/csv');
      res.attachment(`${filename}.csv`);
      return res.send('');
    }
    const parser = new Parser();
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment(`${filename}.csv`);
    return res.send(csv);
  }
  return res.json({ data, count: data.length });
};

export const getCirculationLog = asyncHandler(async (req: Request, res: Response) => {
  const { format, startDate, endDate, memberId } = req.query;

  const where: any = {};
  if (memberId) where.member_id = parseInt(memberId as string);

  const logs = await prisma.borrowings.findMany({
    where,
    include: {
      users: { select: { name: true, username: true } },
      book_copies: {
        include: { books: { select: { title: true } } }
      }
    },
    orderBy: { borrow_date: 'desc' }
  });

  // Flatten for CSV
  const flattenedData = logs.map((l) => ({
    id: l.id,
    member: l.users.name,
    book: l.book_copies.books.title,
    barcode: l.book_copies.barcode,
    borrow_date: l.borrow_date,
    due_date: l.due_date,
    return_date: l.return_date,
    status: l.status
  }));

  sendReportResponse(res, flattenedData, format as string, 'circulation_log');
});

export const getBlockedMembers = asyncHandler(async (req: Request, res: Response) => {
  const { format } = req.query;

  // Find users with 'blocked' status
  const blockedStatusUsers = await prisma.users.findMany({
    where: { account_status: 'blocked' }
  });

  // Find users with unpaid fines > 0
  const usersWithFines = await prisma.users.findMany({
    where: {
      borrowings: {
        some: {
          fines: { status: 'unpaid', amount: { gt: 0 } }
        }
      }
    },
    include: {
      borrowings: {
        include: { fines: true }
      }
    }
  });

  const merged = new Map();

  blockedStatusUsers.forEach((u) => {
    merged.set(u.id, {
      id: u.id,
      name: u.name,
      email: u.email,
      reason: 'Account status is blocked',
      unpaid_fines: 0
    });
  });

  usersWithFines.forEach((u) => {
    const totalFines = u.borrowings.reduce((sum, b) => {
      return sum + (b.fines && b.fines.status === 'unpaid' ? b.fines.amount : 0);
    }, 0);

    if (merged.has(u.id)) {
      merged.get(u.id).unpaid_fines = totalFines;
      merged.get(u.id).reason += ' & Unpaid Fines';
    } else {
      merged.set(u.id, {
        id: u.id,
        name: u.name,
        email: u.email,
        reason: 'Unpaid Fines',
        unpaid_fines: totalFines
      });
    }
  });

  const finalData = Array.from(merged.values());
  sendReportResponse(res, finalData, format as string, 'blocked_members');
});

// Last 7 calendar days (including today), oldest first, as YYYY-MM-DD keys.
function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export const getWeeklyActivity = asyncHandler(async (req: Request, res: Response) => {
  const days = lastNDays(7);
  const rangeStart = `${days[0]}T00:00:00.000Z`;

  const [checkedOut, returned, paidFines] = await Promise.all([
    prisma.borrowings.findMany({
      where: { borrow_date: { gte: rangeStart } },
      select: { borrow_date: true }
    }),
    prisma.borrowings.findMany({
      where: { return_date: { gte: rangeStart } },
      select: { return_date: true }
    }),
    prisma.fines.findMany({
      where: { status: 'paid', payment_date: { gte: rangeStart } },
      select: { payment_date: true, amount: true }
    })
  ]);

  const byDay = Object.fromEntries(
    days.map((day) => [day, { date: day, checkouts: 0, returns: 0, fines_collected: 0 }])
  );

  checkedOut.forEach((b) => {
    const day = b.borrow_date.slice(0, 10);
    if (byDay[day]) byDay[day].checkouts += 1;
  });
  returned.forEach((b) => {
    if (!b.return_date) return;
    const day = b.return_date.slice(0, 10);
    if (byDay[day]) byDay[day].returns += 1;
  });
  paidFines.forEach((f) => {
    if (!f.payment_date) return;
    const day = f.payment_date.slice(0, 10);
    if (byDay[day]) byDay[day].fines_collected += f.amount;
  });

  const data = days.map((day) => byDay[day]);
  const { format } = req.query;
  sendReportResponse(res, data, format as string, 'weekly_activity');
});

export const getRosterAudit = asyncHandler(async (req: Request, res: Response) => {
  const { format } = req.query;

  const users = await prisma.users.findMany({
    where: { role: 'member' },
    select: { id: true, name: true, student_id: true, index_number: true }
  });

  const roster = await prisma.student_roster.findMany();
  const rosterMap = new Map(roster.map((r) => [r.student_id, r]));

  const auditResults = users.map((u) => {
    const rosterRecord = u.student_id ? rosterMap.get(u.student_id) : undefined;
    let status = 'Match';
    let details = 'Valid';

    if (!u.student_id) {
      status = 'Mismatch';
      details = 'No student ID provided';
    } else if (!rosterRecord) {
      status = 'Mismatch';
      details = 'Student ID not found in roster';
    } else if (rosterRecord.index_number !== u.index_number) {
      status = 'Mismatch';
      details = 'Index number does not match roster';
    } else if (rosterRecord.name.toLowerCase() !== u.name.toLowerCase()) {
      status = 'Warning';
      details = 'Name variation detected';
    }

    return {
      user_id: u.id,
      registered_name: u.name,
      student_id: u.student_id,
      registered_index: u.index_number,
      roster_name: rosterRecord?.name || 'N/A',
      roster_index: rosterRecord?.index_number || 'N/A',
      audit_status: status,
      details
    };
  });

  sendReportResponse(res, auditResults, format as string, 'roster_audit');
});
