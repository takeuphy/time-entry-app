# CLAUDE.md — time-entry-app

This file provides context for AI assistants working on this repository.

## Project Overview

**time-entry-app** is a mobile-first web application for corporate lawyers who bill on a time-charge basis. It allows:
- Voice-input of time entries (client, matter, time range, work description)
- Review/management of entries by the lawyer and their assistant
- Automatic daily email reports sent to the assistant at 9:00 AM

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite via Prisma ORM
- **Styling**: Tailwind CSS
- **Email**: Nodemailer (SMTP)
- **Voice Input**: Web Speech API (`webkitSpeechRecognition`, Japanese `ja-JP`)
- **Deployment**: PWA-ready (manifest.json, standalone output)

## Commands

```bash
npm install          # Install dependencies (also runs prisma generate via postinstall)
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push Prisma schema to database (creates/updates tables)
npm run db:migrate   # Create a Prisma migration
npm run db:studio    # Open Prisma Studio (database GUI)
```

## Project Structure

```
time-entry-app/
├── CLAUDE.md                              # This file
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── .eslintrc.json
├── .env.example                           # Environment variable template
├── prisma/
│   └── schema.prisma                      # Database schema (TimeEntry model)
├── public/
│   └── manifest.json                      # PWA manifest
└── src/
    ├── types/
    │   └── speech.d.ts                    # Web Speech API type declarations
    ├── hooks/
    │   └── useSpeechRecognition.ts         # Speech recognition React hook
    ├── lib/
    │   ├── prisma.ts                      # Prisma client singleton
    │   └── email.ts                       # Daily report email sender
    ├── components/
    │   ├── VoiceInput.tsx                 # Microphone button component
    │   ├── EntryForm.tsx                  # Time entry form with voice input
    │   └── EntryList.tsx                  # Entry list display with totals
    └── app/
        ├── layout.tsx                     # Root layout (PWA meta tags, Japanese lang)
        ├── globals.css                    # Tailwind directives + mobile styles
        ├── page.tsx                       # Main page — entry form + today's list
        ├── entries/
        │   └── page.tsx                   # Review page — browse entries by date
        └── api/
            ├── entries/
            │   └── route.ts              # CRUD API: GET (by date), POST, DELETE
            └── send-daily-report/
                └── route.ts              # POST: sends daily email report
```

## Database Schema

Single model — `TimeEntry`:

| Field       | Type     | Description                |
|-------------|----------|----------------------------|
| id          | Int (PK) | Auto-increment             |
| clientName  | String   | Client name                |
| matterName  | String   | Matter/case name           |
| date        | String   | YYYY-MM-DD (indexed)       |
| startTime   | String   | HH:MM                      |
| endTime     | String   | HH:MM                      |
| description | String   | Work description           |
| createdAt   | DateTime | Auto-set on creation       |
| updatedAt   | DateTime | Auto-updated               |

## API Endpoints

| Method | Path                    | Description                              |
|--------|-------------------------|------------------------------------------|
| GET    | /api/entries?date=YYYY-MM-DD | Get entries for a specific date       |
| POST   | /api/entries            | Create a new entry (JSON body)           |
| DELETE | /api/entries?id=N       | Delete an entry by ID                    |
| POST   | /api/send-daily-report  | Send email report (?date= optional, defaults to yesterday) |

## Pages

- `/` — **Main entry page** (mobile-optimized). Voice-enabled form for recording time entries. Shows today's entries below the form.
- `/entries` — **Review page** for the assistant. Date navigation to browse entries. Supports `?date=YYYY-MM-DD` query parameter.

## Daily Email Report Setup

1. Configure SMTP in `.env` (copy from `.env.example`)
2. Set up a cron job to call the API daily at 9:00 AM:
   ```
   0 9 * * * curl -X POST http://localhost:3000/api/send-daily-report
   ```
   Or use Vercel Cron if deploying to Vercel (add to `vercel.json`).

## Key Conventions

- **Language**: UI and messages are in Japanese
- **Time format**: 24-hour HH:MM; time pickers use 6-minute increments (0.1h billing units)
- **Date handling**: Dates stored as `YYYY-MM-DD` strings for simple filtering
- **Client components**: Pages using voice/state are `"use client"`; `useSearchParams` must be wrapped in `<Suspense>`
- **Prisma client**: Singleton pattern in `src/lib/prisma.ts` to prevent connection leaks in dev
- **Voice input**: Each text field has its own `<VoiceInput>` button; recognition language is `ja-JP`

## Environment Variables

| Variable         | Required | Description                        |
|------------------|----------|------------------------------------|
| DATABASE_URL     | Yes      | Prisma DB URL (`file:./dev.db`)    |
| SMTP_HOST        | For email| SMTP server hostname               |
| SMTP_PORT        | For email| SMTP port (587 or 465)             |
| SMTP_USER        | For email| SMTP auth username                 |
| SMTP_PASS        | For email| SMTP auth password                 |
| SMTP_FROM        | For email| Sender email address               |
| ASSISTANT_EMAIL  | For email| Recipient (assistant) email        |
| APP_URL          | Optional | App base URL for email links       |

## Notes for AI Assistants

- Always read existing files before modifying them
- Run `npm run build` after changes to verify the build passes
- Run `npm run lint` to check for ESLint errors
- After modifying `prisma/schema.prisma`, run `npm run db:push` to sync the database
- The `.env` file contains `DATABASE_URL` only — email settings require user configuration
- Do not commit `.env` or `prisma/*.db` files (already in `.gitignore`)
- Keep this CLAUDE.md updated when adding new pages, API routes, or dependencies
