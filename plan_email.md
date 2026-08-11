TL;DR – Adopt a reusable table‑based email wrapper with branding header/footer, inline‑styled for maximum client compatibility, and store each template as a separate Handlebars (.hbs) file referenced by email.service.ts.

Unified wrapper

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Helvetica, Arial, sans-serif; background:#f9f9f9; padding:20px;">
Central container <table width="600" align="center" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
Header row with logo + brand colors.
Footer row with copyright, contact links, and unsubscribe placeholder.
Styling strategy

Use inline CSS (email clients strip `` blocks).
Define a small set of reusable style snippets (button, heading, paragraph) and copy‑paste into each template.
Keep fonts, colors, and spacing consistent across all emails.
File organization

templates/email/base.hbs – contains the wrapper and {{{body}}} placeholder.
templates/email/verify.hbs, templates/email/reminder.hbs, templates/email/overdue.hbs – contain only the email‑specific body markup.
In email.service.ts, render with Handlebars: baseTemplate({ body: specificBody, ...variables }).
Asset handling

Host logo and any icons on a CDN (HTTPS) and reference absolute URLs.
Use alt text for images for accessibility.
Testing & compatibility

Validate with Litmus or Email on Acid.
Inline‑CSS fallback: keep critical styles (font, colors) in the style attribute.
Base wrapper (base.hbs)
templates/email/base.hbs
Download
Copy
<!-- file: templates/email/base.hbs -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:Helvetica,Arial,sans-serif;background:#f9f9f9;padding:20px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:20px;text-align:center;color:#ffffff;">
            <img src="https://cdn.example.com/logo.png" alt="SmartLib" width="120" style="display:block;margin:auto;">
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:30px;">
            {{{body}}}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f1f1f1;padding:15px;font-size:12px;color:#555555;text-align:center;">
            © {{year}} SmartLib • <a href="{{unsubscribeUrl}}" style="color:#4f46e5;text-decoration:none;">Unsubscribe</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
1. Account Verification (verify.hbs)
templates/email/verify.hbs
Download
Copy
<!-- file: templates/email/verify.hbs -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td>
      <h2 style="font-size:24px;color:#333333;margin-bottom:10px;">Welcome to SmartLib, {{name}}!</h2>
      <p style="font-size:16px;color:#555555;margin:15px 0;">Please verify your email using the button below:</p>
      <a href="{{verificationLink}}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 25px;text-decoration:none;border-radius:4px;font-weight:bold;">Verify Email</a>
    </td>
  </tr>
</table>
2. Due‑Soon Reminder (reminder.hbs)
templates/email/reminder.hbs
Download
Copy
<!-- file: templates/email/reminder.hbs -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td>
      <h2 style="font-size:22px;color:#333333;margin-bottom:10px;">Reminder: "{{bookTitle}}" is due soon</h2>
      <p style="font-size:16px;color:#555555;margin:15px 0;">
        Hi {{name}}, your loan of <strong>{{bookTitle}}</strong> is due on <strong>{{dueDate}}</strong>.
      </p>
      <p style="font-size:16px;color:#555555;margin:15px 0;">
        Please return it by then to avoid a late fine.
      </p>
    </td>
  </tr>
</table>
3. Overdue & Fine Notice (overdue.hbs)
templates/email/overdue.hbs
Download
Copy
<!-- file: templates/email/overdue.hbs -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td>
      <h2 style="font-size:22px;color:#c53030;margin-bottom:10px;">Overdue: "{{bookTitle}}"</h2>
      <p style="font-size:16px;color:#555555;margin:15px 0;">
        Hi {{name}}, your loan of <strong>{{bookTitle}}</strong> was due on <strong>{{dueDate}}</strong> and is now <strong>{{daysOverdue}} day(s) overdue</strong>.
      </p>
      <p style="font-size:16px;color:#555555;margin:15px 0;">
        A fine of <strong>${{fineAmount}}</strong> has been applied to your account. Please return the book as soon as possible.
      </p>
    </td>
  </tr>
</table>
Usage in email.service.ts
src/services/email.service.ts
Download
Copy
// file: src/services/email.service.ts
import fs from 'fs';
import Handlebars from 'handlebars';
import { sendMail } from './mailProvider'; // your existing mail transport

// Load templates once
const baseTemplate = Handlebars.compile(
  fs.readFileSync('templates/email/base.hbs', 'utf8')
);
const verifyBody = Handlebars.compile(
  fs.readFileSync('templates/email/verify.hbs', 'utf8')
);
const reminderBody = Handlebars.compile(
  fs.readFileSync('templates/email/reminder.hbs', 'utf8')
);
const overdueBody = Handlebars.compile(
  fs.readFileSync('templates/email/overdue.hbs', 'utf8')
);

export async function sendVerification(email: string, vars: { name: string; verificationLink: string }) {
  const body = verifyBody(vars);
  const html = baseTemplate({ body, year: new Date().getFullYear(), unsubscribeUrl: 'https://smartlib.example.com/unsubscribe' });
  await sendMail(email, 'Activate Your SmartLib Account', html);
}

// Similar functions for reminder & overdue using reminderBody / overdueBody
Gotchas

Keep all CSS inline; many clients (Outlook) ignore `` tags.
Test with a plain‑text fallback (text property) in the mail provider.
Ensure all URLs are HTTPS and reachable; broken images cause spam‑filter hits.