import type { InfoPages } from "./index";

/**
 * 영어(/en) 안내 페이지 본문. 번역이 아니라 미국 이용자 기준으로 따로 쓴 내용이다.
 * {brand} 사이트 이름, {email} 문의 이메일, {date} 시행일, {domain} 도메인.
 */
export const enPages: InfoPages = {
  about: {
    title: "About Us",
    description:
      "{brand} is a free practice-question site for US certification and licensing exams, built for five-minute study breaks. Here is how our questions are written and kept up to date.",
    sections: [
      {
        heading: "What {brand} is",
        body: `{brand} is a **free practice-question site for US certification and licensing exams**.

Most people studying for a trade or professional exam are doing it around a full-time job. So the site is built for short breaks: open it on your phone or a work computer, answer five questions, and see the answer and a plain-English explanation right away.

- No account is needed to practice.
- Text size can be enlarged, and there is a dark mode.
- Questions you miss are saved to a review list that you can retry or print.
- Everything is free.`,
      },
      {
        heading: "How the questions are put together",
        body: `**Every question on this site is an original, AI-written practice question.** We do not publish real exam questions. Questions are written from each exam's publicly available outline (sections, number of questions, passing score) and are modeled on the topics and difficulty the exam is known for.

- **Easy, Medium, Hard**: Easy shows 2 answer choices, Medium shows 3, and Hard shows 4. Start easy and work up to the real thing.
- **Full mock exam**: the same number of questions, section breakdown, answer choices, and time limit as the real exam. Your result is checked against the real passing score.
- **Exam outline**: each section and unit shows its weight on the exam and an importance rating, so you know what to study first when time is short.
- **Explanations**: each question explains the key idea and why each wrong choice is wrong. Calculation questions are worked step by step.
- **Unit summaries**: must-know points and sample questions for each unit on one page.

Each question is labeled with its source and review status, such as "AI practice question · Not yet reviewed". "Not yet reviewed" means a subject-matter expert has not checked it yet.`,
      },
      {
        heading: "How the site is updated",
        body: `- **Problem reports**: use "Report a problem" on the practice screen to flag a wrong answer, a typo, or a confusing explanation. No login is needed, and we do not record who sent the report.
- **Corrections**: reported questions are checked and fixed. A corrected question keeps the same ID, so your review list and history stay intact. Questions we stop using are retired rather than reused.
- **New exams**: exams are added as their question sets are finished. An exam marked "Coming soon" is one we are still writing questions for.
- **Exam changes**: when an exam's content or passing score changes, we update the exam info and questions. Updates can lag, so always confirm dates, fees, and eligibility with the official exam provider.`,
      },
      {
        heading: "Please keep in mind",
        body: `{brand} is an **independent study site**. It is not affiliated with, endorsed by, or sponsored by any exam provider, licensing board, or government agency. Questions and explanations may contain errors, and a score here does not guarantee a result on the real exam. See our Disclaimer for details.

Contact: {email}`,
      },
    ],
  },

  contact: {
    title: "Contact",
    description:
      "How to reach {brand}. Report question errors from the practice screen; email us for everything else, including privacy requests.",
    sections: [
      {
        heading: "Email",
        body: `Write to us at the address below. We read every message and reply in the order received.

**{email}**

- Feedback and suggestions
- Privacy requests (access, correction, deletion)
- Copyright or trademark concerns
- Advertising and partnership inquiries`,
      },
      {
        heading: "Found a mistake in a question?",
        body: `The fastest way is **"Report a problem" on the practice screen**. It tells us exactly which question you mean, and you do not need to log in.`,
      },
      {
        heading: "Forgot your password?",
        body: `We do not collect an email address or phone number, so **we have no way to verify who you are and cannot reset a password.** Please create a new account. You can always practice without logging in.`,
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    description:
      "What {brand} collects, why, how long we keep it, how to delete it, how cookies and advertising work, and the choices and rights you have.",
    sections: [
      {
        heading: "Summary",
        body: `- To create an account we ask for **a username, a password, and a display name. Nothing else.** No real name, email, phone number, or address.
- If you do not log in, your practice history stays **in your browser on your device** and is never sent to our servers.
- We do not sell your personal information.
- You can delete your account and all of its data at any time from My page.`,
      },
      {
        heading: "Information we collect and why",
        body: `**Account information** (only if you sign up): username, password (stored only as a hash), and display name. We use it to log you in and identify your account.

**Study records** (only while logged in): questions answered with correct/wrong counts and dates, score history, your review list and notes, and certifications you add to your profile. We store these so your progress follows you across devices.

**Automatically created information**: the date you signed up, the date you were last active, and a count of failed login attempts (used to temporarily lock an account after repeated failures).

**Problem reports**: the question, the reason you picked, and any details you type. We do not record who sent a report. Please do not include personal information in reports or notes.

**Reviews**: your star rating, the review text, where you are now (studying, passed, or did not pass), and a display name. You can post without an account. To limit how many reviews come from one place in a day we store a one-way hash of your IP address, never the address itself, and we run a human check (Cloudflare Turnstile) before a review is posted. Reviews are public, so please do not include personal information.

**Practice counts**: when a practice session ends we add one to a weekly count for that exam. We do not record who took it.

We use this information only to provide and secure the service, to publish reviews, and to fix reported questions.`,
      },
      {
        heading: "If you do not log in",
        body: `**Without an account, your practice history, review list, and display settings are stored only in your browser (on your device).** They are not sent to our servers and we cannot see them.

- Clearing your browser's site data removes them.
- "Delete all records on this device" on My page removes them in one step.
- They do not appear on other devices or browsers.`,
      },
      {
        heading: "How we protect passwords",
        body: `We never store your password as you typed it. We store only a salted, one-way **hash**, so even we cannot read it. The token that keeps you logged in is also stored on our servers only as a hash. All traffic uses HTTPS, accounts lock for 5 minutes after 5 failed logins in a row, and passwords and login tokens are never written to logs.

No system is perfectly secure, but we collect very little so there is very little to lose.`,
      },
      {
        heading: "Cookies, local storage, and advertising",
        body: `We use:

- **A login cookie** to keep you signed in (only if you log in; up to 30 days).
- **A language cookie** to remember whether you chose English or Korean.
- **Browser local storage** for your practice history, review list, text size, and light/dark setting.
- **Advertising cookies**, when ads are shown. We use Google AdSense. Google and its partners may use cookies to show ads based on your prior visits to this site and other sites.

**Your choices**

1. Turn off personalized ads from Google at adssettings.google.com.
2. Opt out of personalized ads from many other ad companies at aboutads.info/choices.
3. Block or delete cookies in your browser settings. Practice still works with cookies blocked, though you may not stay logged in.

We do not pass your username, display name, or study records to advertisers.`,
      },
      {
        heading: "Service providers",
        body: `We do not sell or rent personal information, and we share it only with the providers that run the site:

- **Cloudflare, Inc.** hosts the site and the account database. Account information and study records are stored on Cloudflare's infrastructure, and Cloudflare processes connection data such as IP addresses to deliver and protect the site.
- **Google LLC (Google AdSense)** serves advertising, as described above.

We may also disclose information if required by law.`,
      },
      {
        heading: "How long we keep information",
        body: `- **Account information and study records**: until you delete your account. Deletion is immediate.
- **Login sessions**: up to 30 days, or until you log out.
- **Failed login counts**: cleared when you log in successfully or delete your account.
- **Problem reports**: contain no information that identifies you and are kept to maintain question quality.
- **Reviews**: stay published until removed. Reviews posted while logged in are deleted when you delete your account. To remove a review posted without an account, email {email}.`,
      },
      {
        heading: "Your rights and how to delete your data",
        body: `- **See your data**: My page shows the records stored for your account.
- **Correct it**: you can edit or remove your notes and the certifications on your profile.
- **Delete it**: choose "Delete account" at the bottom of My page. Your account, study records, review list, and login sessions are permanently removed from our servers right away.
- **Device records**: logging out clears the records on that device. If you never logged in, use "Delete all records on this device" on My page.

Depending on where you live (for example, California), you may have additional rights to know, correct, or delete personal information and to not be discriminated against for using those rights. To make a request, email {email}. Because we do not hold your email or phone number, we may ask for your username to confirm the account is yours.

We do not sell personal information and do not share it for cross-context behavioral advertising beyond the advertising cookies described above, which you can turn off using the choices listed there.`,
      },
      {
        heading: "Children",
        body: `{brand} is intended for adults preparing for professional exams. It is not directed to children under 13, and we do not knowingly collect personal information from them. If you believe a child has created an account, contact us and we will delete it.`,
      },
      {
        heading: "Changes and contact",
        body: `If we change this policy, we will post the new version here and update the date below.

Questions or requests: {email}

**Effective date: {date}**`,
      },
    ],
  },

  terms: {
    title: "Terms of Service",
    description:
      "The terms for using {brand}: what the service offers, accounts, acceptable use, ownership of content, and limits of liability.",
    sections: [
      {
        heading: "1. Agreement",
        body: `These terms apply to your use of {brand} (the "site"). By using the site you agree to them. If you do not agree, please do not use the site.`,
      },
      {
        heading: "2. The service",
        body: `{brand} provides practice questions, grading, explanations, exam outlines, unit summaries, a review list, and score history for certification and licensing exams. The site is free, works without an account, and may display advertising.`,
      },
      {
        heading: "3. Accounts",
        body: `- An account needs only a username, a password, and a display name.
- You are responsible for keeping your password private and for activity on your account.
- We do not collect an email or phone number, so a forgotten password cannot be recovered.
- You can delete your account at any time from My page. Deletion is immediate and permanent.
- We may restrict or remove accounts with offensive names or accounts that violate these terms.`,
      },
      {
        heading: "4. Acceptable use",
        body: `You agree not to:

- scrape or bulk-download questions or explanations with automated tools;
- copy, redistribute, or sell the site's content without permission;
- interfere with the site or place an unreasonable load on it;
- use someone else's account; or
- submit abusive content, advertising, or other people's personal information in problem reports.`,
      },
      {
        heading: "5. Content ownership",
        body: `The questions, explanations, summaries, and design of the site belong to {brand}. You may view and print them for your own personal study. For any other use, contact us first.

Exam and certification names belong to their respective owners and are used only to identify the exams the practice questions relate to.`,
      },
      {
        heading: "6. No warranty; limitation of liability",
        body: `The site is provided "as is" and "as available". Questions and explanations are AI-written and may contain errors. We make no warranty that the content is accurate, complete, current, or representative of any real exam, or that using the site will lead to a passing score.

To the fullest extent permitted by law, {brand} is not liable for any indirect, incidental, or consequential damages, or for any exam result, arising from your use of the site. We may change, suspend, or discontinue any part of the site at any time. Records stored only in your browser cannot be recovered if they are lost.

See the Disclaimer for more.`,
      },
      {
        heading: "7. Changes to these terms",
        body: `We may update these terms. The new version will be posted here with a new effective date, and continued use of the site means you accept it.

Contact: {email}

**Effective date: {date}**`,
      },
    ],
  },

  disclaimer: {
    title: "Disclaimer",
    description:
      "{brand} is an independent study site that is not affiliated with any exam provider. Notes on question accuracy, official information, and trademarks.",
    sections: [
      {
        heading: "Not affiliated with any exam provider",
        body: `{brand} is an **independent, unofficial study site**. It is not affiliated with, endorsed by, sponsored by, or approved by the organization that administers any exam or certification covered here, or by any licensing board or government agency.

Always confirm exam dates, fees, eligibility, content outlines, and passing scores with the official exam provider.`,
      },
      {
        heading: "Trademarks",
        body: `All certification names, exam names, and organization names on this site are **trademarks or registered trademarks of their respective owners**. They are used only to identify the exams the practice questions relate to. Their use does not imply any affiliation or endorsement.`,
      },
      {
        heading: "These are not real exam questions",
        body: `{brand} does not publish real exam questions. Every question is an original, AI-written practice question based on publicly available exam outlines. "Sample questions" means questions written in the style of the exam, not questions taken from it.

If you believe anything on this site infringes your rights, email {email} and we will review it promptly.`,
      },
      {
        heading: "Questions may contain errors",
        body: `- Questions, answers, and explanations are AI-written. Items labeled "Not yet reviewed" have not been checked by a subject-matter expert.
- Codes, regulations, and exam content change, and our content may be out of date.
- If something looks wrong, use "Report a problem" on the practice screen.`,
      },
      {
        heading: "No guarantee of passing; not professional advice",
        body: `- Scores and pass/fail indicators on this site are for practice only.
- The "chance of passing" figure is an estimate based on topic importance and frequency, not a real probability.
- Content is for exam study only. It is not legal, safety, medical, or other professional advice. Follow current codes, regulations, and your employer's procedures on the job.`,
      },
      {
        heading: "Advertising",
        body: `The site may display advertising. Ads are created by advertisers, and {brand} does not endorse the products or services advertised.

**Effective date: {date}**`,
      },
    ],
  },
};
