'use client';

import { HelpCircle, BookMarked, Clock, CreditCard, Quote, Mail, Search, Star } from 'lucide-react';
import Card from '../../../components/ui/Card';

interface FaqItem {
  icon: typeof HelpCircle;
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    icon: Search,
    question: 'How do I find and borrow a book?',
    answer:
      'Use the Catalog page to search by title, author, or ISBN, and filter by genre or availability. If a copy is available, a librarian can check it out to you at the front desk.',
  },
  {
    icon: BookMarked,
    question: 'What happens when I reserve a book that\'s checked out?',
    answer:
      'You join a first-come, first-served waitlist for that title. Your dashboard under My Loans shows your queue position and an estimated wait. When a copy becomes free, the reservation is approved in queue order and you get an email once it\'s ready for pickup.',
  },
  {
    icon: Clock,
    question: 'Can I cancel a reservation?',
    answer:
      'Yes — open My Loans, find the reservation under Reservation Queue, and click the X next to it. This immediately removes you from the waitlist and moves everyone behind you up one position.',
  },
  {
    icon: CreditCard,
    question: 'How are fines calculated?',
    answer:
      'Fines accrue per day once a loan passes its due date. You can see any unpaid fines on My Loans — settle them with a librarian to keep borrowing privileges in good standing.',
  },
  {
    icon: Quote,
    question: 'What is the Research Tools feature?',
    answer:
      'Open any book from the Catalog and use the Cite button to generate a ready-to-copy citation in APA, MLA, or Chicago style — useful for bibliographies and reference lists.',
  },
  {
    icon: Star,
    question: 'How do Community Contributions work?',
    answer:
      'You can earn Library Points by helping us improve our catalog! Submit metadata corrections, book reviews, or custom tags on the Contributions page. When a librarian approves your submission, you earn 10 points per contribution. Reaching 50 points automatically unlocks a 28-day extended loan perk.',
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight flex items-center gap-3">
          <HelpCircle className="opacity-60" />
          Help &amp; About
        </h1>
        <p className="opacity-60 mt-1">
          Answers to common questions, plus who to contact if you&apos;re stuck.
        </p>
      </div>

      <section className="space-y-3">
        {faqs.map((faq) => (
          <Card key={faq.question} surface="light" className="p-5 flex items-start gap-4">
            <faq.icon size={20} className="opacity-60 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">{faq.question}</p>
              <p className="text-sm opacity-70 mt-1">{faq.answer}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-widest opacity-60">About SmartLib</h2>
        <Card surface="light" className="p-6">
          <p className="text-sm opacity-70">
            SmartLib is a digital library management system for tracking catalog inventory,
            loans, fines, and reservations across member, librarian, and admin roles.
          </p>
          <p className="text-xs opacity-50 font-mono mt-3">SmartLib v1.0.0</p>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-widest opacity-60">Still need help?</h2>
        <Card surface="light" className="p-5 flex items-center gap-3">
          <Mail size={18} className="opacity-60 shrink-0" />
          <div>
            <p className="font-bold text-sm">Contact Support</p>
            <p className="text-sm opacity-70">Reach the library desk at support@smartlib.local for anything not covered here.</p>
          </div>
        </Card>
      </section>
    </div>
  );
}
